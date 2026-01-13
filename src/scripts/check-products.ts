import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function checkProducts({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const productModule = container.resolve(Modules.PRODUCT);
    const salesChannelModule = container.resolve(Modules.SALES_CHANNEL);
    const pricingModule = container.resolve(Modules.PRICING);
    const regionModule = container.resolve(Modules.REGION);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    logger.info("--- CHECKING REGIONS ---");
    const regions = await regionModule.listRegions();
    for (const region of regions) {
        logger.info(`Region: ${region.name} (${region.id}) - Currency: ${region.currency_code}`);
        logger.info(`Countries: ${region.countries?.map(c => c.iso_2).join(", ")}`);
    }

    logger.info("--- CHECKING SALES CHANNELS ---");
    const salesChannels = await salesChannelModule.listSalesChannels();
    for (const sc of salesChannels) {
        logger.info(`Sales Channel: ${sc.name} (${sc.id})`);
    }

    logger.info("--- CHECKING PRODUCTS ---");
    // Use query to get full details including sales channels and variants
    const { data: products } = await query.graph({
        entity: "product",
        fields: [
            "id",
            "title",
            "status",
            "sales_channels.*",
            "variants.*",
            "variants.prices.*"
        ],
    });

    for (const product of products) {
        logger.info(`Product: ${product.title} (${product.id})`);
        logger.info(`  Status: ${product.status}`);
        logger.info(`  Sales Channels: ${product.sales_channels?.map((sc: any) => sc.name).join(", ") || "None"}`);

        if (product.variants) {
            for (const variant of product.variants) {
                logger.info(`  Variant: ${variant.title} (${variant.id})`);
                if (variant.prices) {
                    for (const price of variant.prices) {
                        logger.info(`    Price: ${price.amount} ${price.currency_code} (Rules: ${JSON.stringify(price.rules)})`);
                    }
                } else {
                    logger.info(`    No prices found for variant.`);
                }
            }
        } else {
            logger.info(`  No variants found.`);
        }
        logger.info("------------------------------------------------");
    }
}
