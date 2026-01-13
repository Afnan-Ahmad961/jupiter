import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function checkApiKeys({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data: apiKeys } = await query.graph({
        entity: "api_key",
        fields: ["id", "title", "type", "sales_channels.name", "sales_channels.id"]
    });

    logger.info("--- API KEYS ---");
    for (const key of apiKeys) {
        const channels = key.sales_channels?.map((sc: any) => `${sc.name} (${sc.id})`).join(", ") || "NONE";
        logger.info(`Key: ${key.title} | Type: ${key.type} | Channels: ${channels}`);
    }

    const { data: salesChannels } = await query.graph({
        entity: "sales_channel",
        fields: ["id", "name", "products.title"]
    });

    logger.info("--- SALES CHANNELS ---");
    for (const sc of salesChannels) {
        const products = sc.products?.map((p: any) => p.title).join(", ") || "NONE";
        logger.info(`SC: ${sc.name} | Products: ${products}`);
    }
}
