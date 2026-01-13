
import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createShippingOptionsWorkflow } from "@medusajs/medusa/core-flows";

export default async function addShippingOptions({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const fulfillmentModule = container.resolve(Modules.FULFILLMENT);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    logger.info("Adding shipping options for Pakistan...");

    const { data: regions } = await query.graph({
        entity: "region",
        fields: ["id", "name"],
        filters: { name: "Pakistan" }
    });

    const pkRegion = regions[0];

    if (!pkRegion) {
        logger.error("Pakistan region not found. Please run `fix-regions` script first.");
        return;
    }

    logger.info(`Found Pakistan region with ID: ${pkRegion.id}`);

    const shippingProfiles = await fulfillmentModule.listShippingProfiles({
        type: "default",
    });
    let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null;

    if (!shippingProfile) {
        logger.error("Default shipping profile not found.");
        return;
    }

    logger.info(`Found default shipping profile with ID: ${shippingProfile.id}`);

    const fulfillmentSets = await fulfillmentModule.listFulfillmentSets({
        name: "European Warehouse delivery",
    });

    let fulfillmentSet = fulfillmentSets.length ? fulfillmentSets[0] : null;

    if (!fulfillmentSet) {
        logger.error("European Warehouse delivery fulfillment set not found. Please run `seed` script first.");
        return;
    }

    logger.info(`Found fulfillment set with ID: ${fulfillmentSet.id}`);

    const serviceZones = await fulfillmentModule.listServiceZones({
        fulfillment_set_id: fulfillmentSet.id,
    }, {
        relations: ["geo_zones"],
    });

    const serviceZone = serviceZones.find(sz => sz.geo_zones.some(gz => gz.country_code === "pk"));

    if (serviceZone) {
        logger.info("Shipping option for Pakistan already exists.");
        return;
    }

    try {
        await createShippingOptionsWorkflow(container).run({
            input: [
                {
                    name: "Standard Shipping",
                    price_type: "flat",
                    provider_id: "manual_manual",
                    service_zone_id: serviceZones[0].id,
                    shipping_profile_id: shippingProfile.id,
                    type: {
                        label: "Standard",
                        description: "Ship in 5-7 days.",
                        code: "standard",
                    },
                    prices: [
                        {
                            currency_code: "pkr",
                            amount: 500, // 500 PKR
                        },
                    ],
                    rules: [
                      {
                        attribute: "enabled_in_store",
                        value: "true",
                        operator: "eq",
                      },
                      {
                        attribute: "is_return",
                        value: "false",
                        operator: "eq",
                      },
                    ],
                },
            ],
        });
        logger.info("Successfully created shipping option for Pakistan.");
    } catch (e) {
        logger.error("Failed to create shipping option for Pakistan: " + e.message);
    }
}
