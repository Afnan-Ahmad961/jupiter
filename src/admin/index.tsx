
import ProductStockWidget, { config } from "./widgets/stock-widget";
import { defineDashboardConfig } from "@medusajs/admin";

export default defineDashboardConfig({
  widgets: [
    {
      Component: ProductStockWidget,
      config: {
        ...config,
      },
    },
  ],
});
