import os
import sys
from datetime import date, timedelta

# Ensure backend root is on sys.path and cwd is backend directory
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

from sqlmodel import Session, select
from app.core.database import engine, create_db_and_tables
from app.core.security import hash_password
from app.models.auth import User, UserRole
from app.models.catalog import (
    Product,
    ProductType,
    ProductVariant,
    Plan,
    BillingFrequency,
    QuotationTemplate,
)
from app.models.billing import (
    Subscription,
    SubscriptionLine,
    SubscriptionStatus,
    TaxRule,
    TaxType,
    DiscountRule,
    DiscountType,
    DiscountScope,
)
from app.models.invoicing import (
    Invoice,
    InvoiceLine,
    InvoiceStatus,
    Payment,
    PaymentMethod,
)


def seed_database():
    print("=" * 60)
    print("Brightloop Subscription Management - Database Seeder")
    print("=" * 60)

    create_db_and_tables()

    with Session(engine) as session:
        # Check if users already seeded
        existing_admin = session.exec(select(User).where(User.email == "admin@brightloop.io")).first()
        if existing_admin:
            print("[INFO] Database already contains seed users. Skipping duplicate insert.")
            return

        print("[1/6] Seeding Users...")
        default_pwd_hash = hash_password("Brightloop@2026!")

        admin_user = User(
            email="admin@brightloop.io",
            password_hash=default_pwd_hash,
            role=UserRole.ADMIN,
        )
        staff_user = User(
            email="operations@brightloop.io",
            password_hash=default_pwd_hash,
            role=UserRole.STAFF,
        )
        cust_acme = User(
            email="finance@acmeglobal.com",
            password_hash=default_pwd_hash,
            role=UserRole.CUSTOMER,
        )
        cust_apex = User(
            email="billing@apexrobotics.com",
            password_hash=default_pwd_hash,
            role=UserRole.CUSTOMER,
        )

        session.add_all([admin_user, staff_user, cust_acme, cust_apex])
        session.commit()
        session.refresh(admin_user)
        session.refresh(staff_user)
        session.refresh(cust_acme)
        session.refresh(cust_apex)
        print(f"  + Added 4 Users (Admin, Staff, 2 Customers)")

        print("[2/6] Seeding Products & Variants...")
        prod_erp = Product(
            name="Brightloop Enterprise Cloud Suite",
            type=ProductType.SOFTWARE,
            sales_price=1200.0,
            cost_price=400.0,
            notes="Unified multi-tenant cloud subscription engine.",
        )
        prod_sla = Product(
            name="Dedicated Cloud Support & SLA",
            type=ProductType.SERVICE,
            sales_price=350.0,
            cost_price=150.0,
            notes="24/7 dedicated support team access and Net-15 SLA.",
        )
        prod_copilot = Product(
            name="AI Revenue Copilot Addon",
            type=ProductType.ADDON,
            sales_price=180.0,
            cost_price=50.0,
            notes="Automated predictive cashflow and churn prevention.",
        )

        session.add_all([prod_erp, prod_sla, prod_copilot])
        session.commit()
        session.refresh(prod_erp)
        session.refresh(prod_sla)
        session.refresh(prod_copilot)

        # Variants
        var_odoo = ProductVariant(
            product_id=prod_erp.id,
            attribute_name="Edition",
            attribute_value="Odoo ERP Sync",
            price_extra=560.0,
        )
        var_standard = ProductVariant(
            product_id=prod_erp.id,
            attribute_name="Edition",
            attribute_value="Standard",
            price_extra=0.0,
        )
        var_sla_crit = ProductVariant(
            product_id=prod_sla.id,
            attribute_name="Response SLA",
            attribute_value="1-Hour Critical",
            price_extra=200.0,
        )

        session.add_all([var_odoo, var_standard, var_sla_crit])
        session.commit()
        session.refresh(var_odoo)
        session.refresh(var_standard)
        session.refresh(var_sla_crit)
        print(f"  + Added 3 Products with 3 attribute variants (Odoo ERP Sync +$560)")

        print("[3/6] Seeding Subscription Plans & Templates...")
        plan_monthly = Plan(
            name="Monthly Pro Plan",
            frequency=BillingFrequency.MONTHLY,
            min_quantity=1,
            start_date=date(2026, 1, 1),
            auto_close_on_end=False,
            allow_pause=True,
        )
        plan_yearly = Plan(
            name="Annual Enterprise Plan",
            frequency=BillingFrequency.YEARLY,
            min_quantity=5,
            start_date=date(2026, 1, 1),
            auto_close_on_end=False,
            allow_pause=True,
        )
        plan_weekly = Plan(
            name="Weekly Growth Sprint",
            frequency=BillingFrequency.WEEKLY,
            min_quantity=1,
            start_date=date(2026, 1, 1),
            auto_close_on_end=True,
            allow_pause=False,
        )

        session.add_all([plan_monthly, plan_yearly, plan_weekly])
        session.commit()
        session.refresh(plan_monthly)
        session.refresh(plan_yearly)
        session.refresh(plan_weekly)

        quote_tmpl = QuotationTemplate(
            name="Standard SaaS Starter Quote",
            plan_id=plan_monthly.id,
            duration_days=30,
            terms_and_conditions="Net 15 terms. Invoicing generated automatically on renewal cycle.",
        )
        session.add(quote_tmpl)
        session.commit()
        print("  + Added 3 Subscription Plans (Monthly, Yearly, Weekly) + Quotation Template")

        print("[4/6] Seeding Tax & Discount Rules...")
        tax_gst = TaxRule(
            name="GST / VAT 18%",
            tax_type=TaxType.PERCENT,
            amount=18.0,
            price_included=False,
            is_active=True,
        )
        tax_service = TaxRule(
            name="Digital Services Tax 5%",
            tax_type=TaxType.PERCENT,
            amount=5.0,
            price_included=False,
            is_active=True,
        )
        disc_volume = DiscountRule(
            name="Enterprise Volume $200 OFF",
            discount_type=DiscountType.FIXED,
            scope=DiscountScope.SUBSCRIPTION,
            amount=200.0,
            min_purchase_amount=2000.0,
            is_active=True,
        )
        disc_copilot = DiscountRule(
            name="AI Copilot Promo 15%",
            discount_type=DiscountType.PERCENT,
            scope=DiscountScope.PRODUCT,
            amount=15.0,
            product_id=prod_copilot.id,
            is_active=True,
        )

        session.add_all([tax_gst, tax_service, disc_volume, disc_copilot])
        session.commit()
        session.refresh(tax_gst)
        session.refresh(tax_service)
        session.refresh(disc_volume)
        session.refresh(disc_copilot)
        print("  + Added 2 Tax Rules & 2 Discount Rules")

        print("[5/6] Seeding Subscriptions & Lifecycle States...")
        today = date.today()

        # 1. Active monthly subscription (Acme Global)
        sub1 = Subscription(
            subscription_number="SUB-2026-0001",
            customer_id=cust_acme.id,
            plan_id=plan_monthly.id,
            status=SubscriptionStatus.ACTIVE,
            start_date=date(2026, 10, 1),
            expiry_date=date(2027, 10, 1),
            next_billing_date=date(2026, 11, 1),
            billing_anchor_day=1,
            lines=[
                SubscriptionLine(
                    product_id=prod_erp.id,
                    variant_id=var_odoo.id,
                    quantity=1,
                    unit_price=1760.0,
                    tax_rule_id=tax_gst.id,
                ),
                SubscriptionLine(
                    product_id=prod_sla.id,
                    variant_id=var_sla_crit.id,
                    quantity=1,
                    unit_price=550.0,
                    tax_rule_id=tax_gst.id,
                ),
            ],
        )

        # 2. Active annual enterprise subscription (Apex Robotics)
        sub2 = Subscription(
            subscription_number="SUB-2026-0002",
            customer_id=cust_apex.id,
            plan_id=plan_yearly.id,
            status=SubscriptionStatus.ACTIVE,
            start_date=date(2026, 6, 15),
            expiry_date=date(2027, 6, 14),
            next_billing_date=date(2027, 6, 15),
            billing_anchor_day=15,
            lines=[
                SubscriptionLine(
                    product_id=prod_erp.id,
                    variant_id=var_standard.id,
                    quantity=5,
                    unit_price=1200.0,
                    tax_rule_id=tax_gst.id,
                    discount_rule_id=disc_volume.id,
                ),
            ],
        )

        # 3. Paused weekly subscription (Acme Global)
        sub3 = Subscription(
            subscription_number="SUB-2026-0003",
            customer_id=cust_acme.id,
            plan_id=plan_weekly.id,
            status=SubscriptionStatus.PAUSED,
            start_date=date(2026, 10, 15),
            expiry_date=date(2027, 1, 15),
            next_billing_date=date(2026, 11, 5),
            billing_anchor_day=5,
            lines=[
                SubscriptionLine(
                    product_id=prod_copilot.id,
                    quantity=2,
                    unit_price=180.0,
                ),
            ],
        )

        # 4. Quotation pending approval (Apex Robotics)
        sub4 = Subscription(
            subscription_number="SUB-2026-0004",
            customer_id=cust_apex.id,
            plan_id=plan_monthly.id,
            status=SubscriptionStatus.QUOTATION,
            start_date=date(2026, 11, 1),
            next_billing_date=date(2026, 11, 1),
            billing_anchor_day=1,
            lines=[
                SubscriptionLine(
                    product_id=prod_erp.id,
                    variant_id=var_standard.id,
                    quantity=1,
                    unit_price=1200.0,
                ),
                SubscriptionLine(
                    product_id=prod_sla.id,
                    quantity=1,
                    unit_price=350.0,
                ),
            ],
        )

        # 5. Confirmed quotation ready for activation (Acme Global)
        sub5 = Subscription(
            subscription_number="SUB-2026-0005",
            customer_id=cust_acme.id,
            plan_id=plan_monthly.id,
            status=SubscriptionStatus.CONFIRMED,
            start_date=date(2026, 11, 1),
            next_billing_date=date(2026, 11, 1),
            billing_anchor_day=1,
            lines=[
                SubscriptionLine(
                    product_id=prod_sla.id,
                    quantity=1,
                    unit_price=350.0,
                ),
            ],
        )

        # 6. Closed subscription (Apex Robotics)
        sub6 = Subscription(
            subscription_number="SUB-2026-0006",
            customer_id=cust_apex.id,
            plan_id=plan_monthly.id,
            status=SubscriptionStatus.CLOSED,
            start_date=date(2026, 1, 1),
            expiry_date=date(2026, 6, 1),
            next_billing_date=date(2026, 6, 1),
            billing_anchor_day=1,
            lines=[
                SubscriptionLine(
                    product_id=prod_copilot.id,
                    quantity=1,
                    unit_price=180.0,
                ),
            ],
        )

        session.add_all([sub1, sub2, sub3, sub4, sub5, sub6])
        session.commit()
        session.refresh(sub1)
        session.refresh(sub2)
        print(f"  + Added 6 Subscriptions across all lifecycle states (Active, Quotation, Confirmed, Paused, Closed)")

        print("[6/6] Seeding Invoices & Payments Reconciliation...")
        # Inv 1: Paid invoice
        inv1 = Invoice(
            invoice_number="INV-2026-0001",
            subscription_id=sub1.id,
            customer_id=cust_acme.id,
            status=InvoiceStatus.PAID,
            period_start=date(2026, 10, 1),
            period_end=date(2026, 10, 31),
            invoice_date=date(2026, 10, 1),
            due_date=date(2026, 10, 16),
            idempotency_key=f"{sub1.id}_2026-10-01",
            subtotal=2310.0,
            discount_total=0.0,
            tax_total=415.8,
            total=2725.8,
            lines=[
                InvoiceLine(
                    product_id=prod_erp.id,
                    description="Brightloop Enterprise Cloud Suite (Odoo ERP Sync)",
                    quantity=1,
                    unit_price=1760.0,
                    line_subtotal=1760.0,
                    tax_amount=316.8,
                ),
                InvoiceLine(
                    product_id=prod_sla.id,
                    description="Dedicated Cloud Support & SLA (1-Hour Critical)",
                    quantity=1,
                    unit_price=550.0,
                    line_subtotal=550.0,
                    tax_amount=99.0,
                ),
            ],
        )
        session.add(inv1)
        session.flush()

        pay1 = Payment(
            invoice_id=inv1.id,
            amount=2725.8,
            payment_method=PaymentMethod.BANK_TRANSFER,
            payment_date=date(2026, 10, 5),
            notes="Electronic wire settlement by Acme Global",
        )
        session.add(pay1)

        # Inv 2: Partially paid invoice
        inv2 = Invoice(
            invoice_number="INV-2026-0002",
            subscription_id=sub2.id,
            customer_id=cust_apex.id,
            status=InvoiceStatus.PARTIALLY_PAID,
            period_start=date(2026, 6, 15),
            period_end=date(2027, 6, 14),
            invoice_date=date(2026, 6, 15),
            due_date=date(2026, 7, 1),
            idempotency_key=f"{sub2.id}_2026-06-15",
            subtotal=6000.0,
            discount_total=200.0,
            tax_total=1044.0,
            total=6844.0,
            lines=[
                InvoiceLine(
                    product_id=prod_erp.id,
                    description="Brightloop Enterprise Cloud Suite (Standard) x5",
                    quantity=5,
                    unit_price=1200.0,
                    line_subtotal=6000.0,
                    tax_amount=1044.0,
                    discount_amount=200.0,
                )
            ],
        )
        session.add(inv2)
        session.flush()

        pay2 = Payment(
            invoice_id=inv2.id,
            amount=3422.0,
            payment_method=PaymentMethod.CREDIT_CARD,
            payment_date=date(2026, 6, 20),
            notes="First tranche 50% paid via corporate credit card",
        )
        session.add(pay2)

        # Inv 3: Overdue invoice (> 45 days past due)
        inv3 = Invoice(
            invoice_number="INV-2026-0003",
            subscription_id=sub1.id,
            customer_id=cust_acme.id,
            status=InvoiceStatus.OVERDUE,
            period_start=date(2026, 9, 1),
            period_end=date(2026, 9, 30),
            invoice_date=date(2026, 9, 1),
            due_date=date(2026, 9, 15),
            idempotency_key=f"{sub1.id}_2026-09-01",
            subtotal=2310.0,
            discount_total=0.0,
            tax_total=415.8,
            total=2725.8,
            lines=[
                InvoiceLine(
                    product_id=prod_erp.id,
                    description="Brightloop Enterprise Cloud Suite (Odoo ERP Sync)",
                    quantity=1,
                    unit_price=1760.0,
                    line_subtotal=1760.0,
                    tax_amount=316.8,
                )
            ],
        )
        session.add(inv3)

        # Inv 4: Confirmed invoice pending payment
        inv4 = Invoice(
            invoice_number="INV-2026-0004",
            subscription_id=sub1.id,
            customer_id=cust_acme.id,
            status=InvoiceStatus.CONFIRMED,
            period_start=date(2026, 11, 1),
            period_end=date(2026, 11, 30),
            invoice_date=date(2026, 10, 31),
            due_date=date(2026, 11, 15),
            idempotency_key=f"{sub1.id}_2026-11-01",
            subtotal=2310.0,
            discount_total=0.0,
            tax_total=415.8,
            total=2725.8,
            lines=[
                InvoiceLine(
                    product_id=prod_erp.id,
                    description="Brightloop Enterprise Cloud Suite (Odoo ERP Sync)",
                    quantity=1,
                    unit_price=1760.0,
                    line_subtotal=1760.0,
                    tax_amount=316.8,
                )
            ],
        )
        session.add(inv4)

        # Inv 5: Draft invoice
        inv5 = Invoice(
            invoice_number="INV-2026-0005",
            subscription_id=sub2.id,
            customer_id=cust_apex.id,
            status=InvoiceStatus.DRAFT,
            period_start=date(2026, 11, 1),
            period_end=date(2026, 11, 30),
            invoice_date=date(2026, 10, 31),
            due_date=date(2026, 11, 15),
            idempotency_key=f"{sub2.id}_2026-11-01",
            subtotal=1200.0,
            discount_total=0.0,
            tax_total=216.0,
            total=1416.0,
            lines=[
                InvoiceLine(
                    product_id=prod_erp.id,
                    description="Brightloop Enterprise Cloud Suite (Standard)",
                    quantity=1,
                    unit_price=1200.0,
                    line_subtotal=1200.0,
                    tax_amount=216.0,
                )
            ],
        )
        session.add(inv5)

        session.commit()
        print("  + Added 5 Invoices (Paid, Partially Paid, Overdue, Confirmed, Draft) with Reconciled Payments")

        print("=" * 60)
        print("Database Seed Completed Successfully!")
        print(f"File: {os.path.abspath('database.db')}")
        print("=" * 60)


if __name__ == "__main__":
    seed_database()
