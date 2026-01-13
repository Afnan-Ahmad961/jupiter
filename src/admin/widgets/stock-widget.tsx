
import type { ProductDetailsWidgetProps, WidgetConfig } from "@medusajs/admin";
import { useAdminStockLocations, useAdminUpdateInventoryLevel } from "medusa-react";
import { useState } from "react";
import { Button, Input, Toaster, useToast } from "@medusajs/ui";

const ProductStockWidget = ({ product }: ProductDetailsWidgetProps) => {
  const { stock_locations } = useAdminStockLocations();
  const { mutate: updateInventoryLevel, isLoading } = useAdminUpdateInventoryLevel(
    product.id,
  );
  const { toast } = useToast();

  const [stock, setStock] = useState<Record<string, number>>({});

  const handleStockChange = (variantId: string, value: number) => {
    setStock((prev) => ({ ...prev, [variantId]: value }));
  };

  const handleSave = () => {
    if (!stock_locations || stock_locations.length === 0) {
      toast({
        variant: "error",
        title: "No stock locations found",
        description: "Please create a stock location first.",
      });
      return;
    }

    const locationId = stock_locations[0].id;

    Object.entries(stock).forEach(([variantId, quantity]) => {
      const variant = product.variants.find((v) => v.id === variantId);
      if (variant && variant.inventory[0]?.id) {
        updateInventoryLevel({
          inventory_item_id: variant.inventory[0].id,
          location_id: locationId,
          stocked_quantity: quantity,
        }, {
          onSuccess: () => {
            toast({
              variant: "success",
              title: "Stock updated",
              description: `Stock for variant ${variant.title} updated to ${quantity}.`,
            });
          },
          onError: (error) => {
            toast({
              variant: "error",
              title: "Error updating stock",
              description: error.message,
            });
          }
        });
      }
    });
  };

  return (
    <div className="bg-white p-8 border border-gray-200 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Stock Management</h2>
      <div className="flex flex-col gap-y-4">
        {product.variants.map((variant) => (
          <div key={variant.id} className="grid grid-cols-3 gap-4 items-center">
            <span>{variant.title}</span>
            <div className="flex items-center gap-x-2">
              <span>Current: {variant.inventory_quantity}</span>
            </div>
            <div>
              <Input
                type="number"
                placeholder="New stock"
                value={stock[variant.id] ?? ""}
                onChange={(e) =>
                  handleStockChange(variant.id, parseInt(e.target.value, 10))
                }
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Button
          variant="primary"
          onClick={handleSave}
          isLoading={isLoading}
          disabled={Object.keys(stock).length === 0}
        >
          Save Stock
        </Button>
      </div>
      <Toaster />
    </div>
  );
};

export const config: WidgetConfig = {
  zone: "product.details.after",
};

export default ProductStockWidget;
