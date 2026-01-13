import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createInventoryLevelsWorkflow } from "@medusajs/medusa/core-flows";

export default async function addStock({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const stockLocationModule = container.resolve(Modules.STOCK_LOCATION);

    logger.info("Fetching stock locations...");
    const locations = await stockLocationModule.listStockLocations();
    if (locations.length === 0) {
        logger.error("No stock locations found!");
        return;
    }
    const locationId = locations[0].id;

    logger.info("Fetching all inventory items...");
    const { data: inventoryItems } = await query.graph({
        entity: "inventory_item",
        fields: ["id"]
    });

    logger.info(`Found ${inventoryItems.length} inventory items. Adding stock at ${locationId}...`);

    const inventoryLevels = inventoryItems.map(item => ({
        location_id: locationId,
        stocked_quantity: 1000,
        inventory_item_id: item.id
    }));

    try {
        await createInventoryLevelsWorkflow(container).run({
            input: {
                inventory_levels: inventoryLevels
            }
        });
        logger.info("Stock added successfully!");
    } catch (e) {
        logger.info("Stock addition skipped or failed (might already exist): " + e);
    }
}
