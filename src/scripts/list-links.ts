import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function listLinks({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const link = container.resolve(ContainerRegistrationKeys.LINK);

    logger.info("--- ALL LINKS ---");
    const allLinks = await link.list();

    for (const l of allLinks) {
        logger.info(JSON.stringify(l));
    }
}
