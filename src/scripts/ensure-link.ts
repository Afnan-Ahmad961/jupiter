import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { linkSalesChannelsToApiKeyWorkflow } from "@medusajs/medusa/core-flows";

export default async function ensureLink({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const apiKeyModule = container.resolve(Modules.API_KEY);
    const salesChannelModule = container.resolve(Modules.SALES_CHANNEL);

    logger.info("Fetching publishable API keys...");
    const apiKeys = await apiKeyModule.listApiKeys({ type: "publishable" });

    const storefrontKey = apiKeys[0]; // Assuming there is only one or we pick the first
    if (!storefrontKey) {
        logger.error("No publishable API key found!");
        return;
    }
    logger.info(`Found API Key: ${storefrontKey.title} (${storefrontKey.id})`);

    logger.info("Fetching default sales channel...");
    const channels = await salesChannelModule.listSalesChannels({ name: "Default Sales Channel" });
    const defaultChannel = channels[0];
    if (!defaultChannel) {
        logger.error("Default Sales Channel not found!");
        return;
    }
    logger.info(`Found Sales Channel: ${defaultChannel.name} (${defaultChannel.id})`);

    logger.info("Linking API Key to Sales Channel...");
    try {
        await linkSalesChannelsToApiKeyWorkflow(container).run({
            input: {
                id: storefrontKey.id,
                add: [defaultChannel.id]
            }
        });
        logger.info("Linking successful!");
    } catch (e) {
        logger.info("Linking skipped or failed (might already exist): " + e);
    }
}
