from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from sqlmodel import Session, select

from app.models.billing import (
    DiscountRule,
    DiscountScope,
    DiscountType,
    SubscriptionLine,
    TaxRule,
    TaxType,
)


CENT = Decimal("0.01")


def money(value: Decimal | float | int) -> Decimal:
    return Decimal(str(value)).quantize(CENT, rounding=ROUND_HALF_UP)


def _discount(amount: Decimal, rule: DiscountRule) -> Decimal:
    if rule.discount_type == DiscountType.PERCENT:
        result = amount * Decimal(str(rule.amount)) / Decimal("100")
    else:
        result = Decimal(str(rule.amount))
    return min(money(result), amount)


def _active_discount(rule: DiscountRule, at: date, subtotal: Decimal, quantity: int) -> bool:
    return (
        rule.is_active
        and (rule.start_date is None or rule.start_date <= at)
        and (rule.end_date is None or rule.end_date >= at)
        and (rule.max_uses is None or rule.uses < rule.max_uses)
        and subtotal >= money(rule.min_purchase_amount)
        and quantity >= rule.min_quantity
    )


def calculate_lines(
    session: Session, lines: list[SubscriptionLine], at: date
) -> tuple[list[dict], Decimal, Decimal, Decimal, Decimal, set[int]]:
    """Return invoice lines and rounded subtotal, discount, tax, and total amounts."""
    calculated = []
    subtotal = Decimal("0.00")
    discount_total = Decimal("0.00")
    tax_total = Decimal("0.00")
    exclusive_tax_total = Decimal("0.00")
    applied_rules: set[int] = set()

    for line in lines:
        gross = money(line.unit_price * line.quantity)
        subtotal += gross
        discount = Decimal("0.00")
        rule = session.get(DiscountRule, line.discount_rule_id) if line.discount_rule_id else None
        if rule and rule.scope == DiscountScope.PRODUCT and rule.product_id == line.product_id:
            if _active_discount(rule, at, gross, line.quantity):
                discount = _discount(gross, rule)
                if discount > 0:
                    applied_rules.add(rule.id)

        tax_rule = session.get(TaxRule, line.tax_rule_id) if line.tax_rule_id else None
        discount_total += discount
        calculated.append({
            "product_id": line.product_id,
            "quantity": line.quantity,
            "unit_price": line.unit_price,
            "line_subtotal": float(gross),
            "discount_amount": float(discount),
            "tax_amount": 0.0,
            "tax_rule_id": line.tax_rule_id,
            "price_included": bool(tax_rule.price_included) if tax_rule else False,
            "_tax_rule": tax_rule,
            "_net_before_header_discount": gross - discount,
        })

    header_rules = session.exec(
        select(DiscountRule).where(
            DiscountRule.is_active == True,
            DiscountRule.scope == DiscountScope.SUBSCRIPTION,
        )
    ).all()
    quantity_total = sum(line.quantity for line in lines)
    remaining = max(Decimal("0.00"), subtotal - discount_total)
    for rule in header_rules:
        if _active_discount(rule, at, subtotal, quantity_total):
            amount = _discount(remaining, rule)
            discount_total += amount
            remaining -= amount
            if amount > 0:
                applied_rules.add(rule.id)

    line_bases = [entry["_net_before_header_discount"] for entry in calculated]
    base_total = sum(line_bases, Decimal("0.00"))
    line_discount_total = sum(
        (Decimal(str(item["discount_amount"])) for item in calculated), Decimal("0.00")
    )
    header_discount_total = discount_total - line_discount_total
    allocated = Decimal("0.00")
    for index, (line, entry, line_base) in enumerate(zip(lines, calculated, line_bases)):
        if index == len(lines) - 1:
            header_discount = max(Decimal("0.00"), header_discount_total - allocated)
        elif base_total > 0 and header_discount_total > 0:
            header_discount = money(header_discount_total * line_base / base_total)
            allocated += header_discount
        else:
            header_discount = Decimal("0.00")
        line_discount = Decimal(str(entry["discount_amount"])) + header_discount
        taxable = max(Decimal("0.00"), money(line.unit_price * line.quantity) - line_discount)
        tax = Decimal("0.00")
        tax_rule = entry.pop("_tax_rule")
        entry.pop("_net_before_header_discount")
        if tax_rule and tax_rule.is_active:
            rate = Decimal(str(tax_rule.amount))
            if tax_rule.tax_type == TaxType.PERCENT:
                tax = taxable * rate / Decimal("100")
                if tax_rule.price_included:
                    tax = taxable * rate / (Decimal("100") + rate)
            else:
                tax = rate * line.quantity
            tax = money(tax)
            if not tax_rule.price_included:
                exclusive_tax_total += tax
        tax_total += tax
        entry["discount_amount"] = float(line_discount)
        entry["tax_amount"] = float(tax)

    total = subtotal - discount_total + exclusive_tax_total
    return calculated, money(subtotal), money(discount_total), money(tax_total), money(total), applied_rules
