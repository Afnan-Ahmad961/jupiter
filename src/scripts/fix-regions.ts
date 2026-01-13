import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
    updateRegionsWorkflow,
    deleteRegionsWorkflow,
    createRegionsWorkflow
} from "@medusajs/medusa/core-flows";

export default async function fixRegions({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const regionModule = container.resolve(Modules.REGION);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    logger.info("Cleaning up regions...");

    const { data: regions } = await query.graph({
        entity: "region",
        fields: ["id", "name", "currency_code", "countries.*"]
    });

    logger.info(`Found ${regions.length} regions.`);

    // Keep the latest Pakistan region or create a new one if mess is too big
    // For simplicity, let's delete ALL regions and create the desired ones correctly.
    // WARNING: This might affect existing orders if any, but since it's a new store, it's safer.

    if (regions.length > 0) {
        logger.info("Deleting existing regions to start fresh...");
        await deleteRegionsWorkflow(container).run({
            input: { ids: regions.map(r => r.id) }
        });
    }

    logger.info("Creating Pakistan region with 'pk' country...");
    await createRegionsWorkflow(container).run({
        input: {
            regions: [
                {
                    name: "Pakistan",
                    currency_code: "pkr",
                    countries: ["pk"],
                    payment_providers: ["pp_system_default"]
                }
            ]
        }
    });

    logger.info("Fetching products to ensure they are assigned to the new region (if needed)...");
    // In Medusa v2, products aren't directly linked to regions, but prices are. 
    // Prices have rules for region_id.

    const { data: newRegions } = await query.graph({
        entity: "region",
        fields: ["id", "name", "countries.*"]
    });

    const pkRegion = newRegions.find(r => r.name === "Pakistan");
    if (pkRegion) {
        logger.info(`New Pakistan Region ID: ${pkRegion.id}`);
        logger.info(`Countries: ${pkRegion.countries?.map((c: any) => c.iso_2).join(", ")}`);
    } else {
        logger.error("Failed to create Pakistan region!");
    }
}
