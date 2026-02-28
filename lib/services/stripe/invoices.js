// Stripe invoices service - Fetch and format invoice data from Stripe
import Stripe from "stripe";

/**
 * Initialize Stripe with validation
 */
function getStripeClient() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    return new Stripe(secretKey);
}

export async function getCustomerInvoices(stripeCustomerId, options = {}) {
    const stripe = getStripeClient();
    const { limit = 10, startingAfter } = options;

    if (!stripeCustomerId) {
        return { invoices: [], hasMore: false, nextCursor: null };
    }

    const params = {
        customer: stripeCustomerId,
        limit,
        expand: ["data.charge"],
    };

    if (startingAfter) {
        params.starting_after = startingAfter;
    }

    const response = await stripe.invoices.list(params);

    const invoices = response.data.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        date: new Date(invoice.created * 1000).toISOString(),
        dueDate: invoice.due_date
            ? new Date(invoice.due_date * 1000).toISOString()
            : null,
        amount: invoice.amount_paid || invoice.amount_due,
        currency: invoice.currency,
        status: mapInvoiceStatus(invoice.status),
        pdfUrl: invoice.invoice_pdf || null,
        hostedUrl: invoice.hosted_invoice_url || null,
        description:
            invoice.lines?.data?.[0]?.description ||
            invoice.description ||
            "Subscription payment",
        periodStart: invoice.period_start
            ? new Date(invoice.period_start * 1000).toISOString()
            : null,
        periodEnd: invoice.period_end
            ? new Date(invoice.period_end * 1000).toISOString()
            : null,
    }));

    const lastInvoice = response.data[response.data.length - 1];

    return {
        invoices,
        hasMore: response.has_more,
        nextCursor: response.has_more && lastInvoice ? lastInvoice.id : null,
    };
}

/**
 * Map Stripe invoice status to a display-friendly status
 */
function mapInvoiceStatus(stripeStatus) {
    const statusMap = {
        paid: "PAID",
        open: "OPEN",
        draft: "DRAFT",
        void: "VOID",
        uncollectible: "UNCOLLECTIBLE",
    };

    return statusMap[stripeStatus] || "UNKNOWN";
}
