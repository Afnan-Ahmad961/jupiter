import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function verifyFinal({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data: regions } = await query.graph({
        entity: "region",
        fields: ["id", "name", "currency_code", "countries.iso_2"]
    });

    logger.info("--- REGIONS ---");
    for (const r of regions) {
        const countries = r.countries?.map((c: any) => c.iso_2).join(", ") || "NONE";
        logger.info(`R: ${r.name} | ID: ${r.id} | CC: ${r.currency_code} | Countries: ${countries}`);
    }

    const { data: products } = await query.graph({
        entity: "product",
        fields: ["id", "title", "status", "sales_channels.name", "variants.prices.*"],
        filters: { handle: "kwjajkdnak" } // Using handle or title if known
    });

    logger.info("--- PRODUCTS ---");
    if (products.length === 0) {
        // Try again without filter to see what's there
        const { data: all } = await query.graph({
            entity: "product",
            fields: ["id", "title", "status", "variants.prices.*"]
        });
        for (const p of all) {
            logger.info(`P: ${p.title} | Status: ${p.status}`);
            for (const v of p.variants || []) {
                for (const price of v.prices || []) {
                    logger.info(`  Price: ${price.amount} ${price.currency_code} | Rules: ${JSON.stringify(price.rules)}`);
                }
            }
        }
    } else {
        for (const p of products) {
            logger.info(`P: ${p.title} | Status: ${p.status} | SC: ${p.sales_channels?.map((sc: any) => sc.name).join(", ")}`);
            for (const v of p.variants || []) {
                for (const price of v.prices || []) {
                    logger.info(`  Price: ${price.amount} ${price.currency_code} | Rules: ${JSON.stringify(price.rules)}`);
                }
            }
        }
    }
}
