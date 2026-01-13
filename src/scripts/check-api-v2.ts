import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function checkApiV2({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const apiKeyModule = container.resolve(Modules.API_KEY);
    const salesChannelModule = container.resolve(Modules.SALES_CHANNEL);
    const link = container.resolve(ContainerRegistrationKeys.LINK);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    logger.info("--- FETCHING API KEYS ---");
    const apiKeys = await apiKeyModule.listApiKeys({ type: "publishable" });

    for (const key of apiKeys) {
        logger.info(`Key: ${key.title} | ID: ${key.id}`);

        // Manually find links for this API key
        const links = await link.list({
            [Modules.API_KEY]: { api_key_id: key.id }
        });

        for (const l of links) {
            if (l[Modules.SALES_CHANNEL]) {
                const sc = await salesChannelModule.retrieveSalesChannel(l[Modules.SALES_CHANNEL].sales_channel_id);
                logger.info(` -> Linked to SC: ${sc.name} (${sc.id})`);
            }
        }
    }

    logger.info("--- FETCHING PRODUCTS IN SALES CHANNELS ---");
    const channels = await salesChannelModule.listSalesChannels();
    for (const sc of channels) {
        logger.info(`SC: ${sc.name} (${sc.id})`);
        // Use query for products in SC
        const { data: products } = await query.graph({
            entity: "product",
            fields: ["title", "handle", "status"],
            filters: {
                sales_channels: { id: sc.id }
            }
        });
        for (const p of products) {
            logger.info(`  - Product: ${p.title} (${p.handle}) | Status: ${p.status}`);
        }
    }
}
