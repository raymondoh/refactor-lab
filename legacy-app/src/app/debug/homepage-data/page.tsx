export const dynamic = "force-dynamic";
export const revalidate = 0;

import {
  getAllProducts,
  getOnSaleProducts,
  getNewArrivals
} from "@/firebase/admin/products";
import { getDesignThemes } from "@/firebase/admin/categories";

// Helper function to get themed products
async function getThemedProducts(limit = 6) {
  try {
    const themesResult = await getDesignThemes();
    if (!themesResult.success || !themesResult.data || themesResult.data.length === 0) {
      return { success: false, data: [] };
    }

    const popularThemes = themesResult.data.slice(0, 5);
    const result = await getAllProducts({
      designThemes: popularThemes,
      limit: limit
    });

    return result;
  } catch (error) {
    console.error("Error fetching themed products:", error);
    return { success: false, data: [] };
  }
}

export default async function HomepageDataDebugPage() {
  const fetchTime = new Date().toISOString();

  // Fetch the same data as the homepage
  const [featuredProducts, trendingProducts, saleProducts, newArrivals, themedProducts] =
    await Promise.all([
      getAllProducts({ isFeatured: true, limit: 8 }),
      getAllProducts({ limit: 8 }),
      getOnSaleProducts(6),
      getNewArrivals(6),
      getThemedProducts(6)
    ]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Homepage Data Debug</h1>

      <div className="mb-4 p-4 bg-gray-100 rounded">
        <p>
          <strong>Data fetched at:</strong> {fetchTime}
        </p>
        <p>
          <strong>Refresh this page to get latest data</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Featured Products */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Featured Products</h2>
          <div className="space-y-2">
            <p>
              <strong>Success:</strong> {featuredProducts.success ? "✅ Yes" : "❌ No"}
            </p>
            <p>
              <strong>Count:</strong> {featuredProducts.success ? featuredProducts.data.length : 0}
            </p>
          </div>
        </div>

        {/* Trending Products */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Trending Products</h2>
          <div className="space-y-2">
            <p>
              <strong>Success:</strong> {trendingProducts.success ? "✅ Yes" : "❌ No"}
            </p>
            <p>
              <strong>Count:</strong> {trendingProducts.success ? trendingProducts.data.length : 0}
            </p>
          </div>
        </div>

        {/* Sale Products */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Sale Products</h2>
          <div className="space-y-2">
            <p>
              <strong>Success:</strong> {saleProducts.success ? "✅ Yes" : "❌ No"}
            </p>
            <p>
              <strong>Count:</strong> {saleProducts.success ? saleProducts.data.length : 0}
            </p>
            {!saleProducts.success && (
              <p className="text-red-600">
                <strong>Error:</strong> {saleProducts.error}
              </p>
            )}
          </div>

          {saleProducts.success && saleProducts.data.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Sale Products:</h3>
              <div className="space-y-2 text-sm">
                {saleProducts.data.map(product => (
                  <div key={product.id} className="p-2 bg-gray-50 rounded">
                    <p>
                      <strong>Name:</strong> {product.name}
                    </p>
                    <p>
                      <strong>Price:</strong> £{product.price}
                    </p>
                    <p>
                      <strong>Sale Price:</strong> {product.salePrice ? `£${product.salePrice}` : "None"}
                    </p>
                    <p>
                      <strong>On Sale:</strong> {product.onSale ? "✅ Yes" : "❌ No"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* New Arrivals */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">New Arrivals</h2>
          <div className="space-y-2">
            <p>
              <strong>Success:</strong> {newArrivals.success ? "✅ Yes" : "❌ No"}
            </p>
            <p>
              <strong>Count:</strong> {newArrivals.success ? newArrivals.data.length : 0}
            </p>
          </div>
        </div>

        {/* Themed Products */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Themed Products</h2>
          <div className="space-y-2">
            <p>
              <strong>Success:</strong> {themedProducts.success ? "✅ Yes" : "❌ No"}
            </p>
            <p>
              <strong>Count:</strong> {themedProducts.success ? themedProducts.data.length : 0}
            </p>
          </div>
        </div>
      </div>

      {/* Carousel Decision Logic */}
      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">Carousel Decision</h2>
        <div className="space-y-2">
          <p>
            <strong>Has Valid Sale Products:</strong>{" "}
            {saleProducts.success && saleProducts.data.length >= 1 ? "✅ Yes" : "❌ No"}
          </p>
          <p>
            <strong>Has Valid New Arrivals:</strong>{" "}
            {newArrivals.success && newArrivals.data.length >= 1 ? "✅ Yes" : "❌ No"}
          </p>
          <p>
            <strong>Has Valid Themed Products:</strong>{" "}
            {themedProducts.success && themedProducts.data.length >= 1 ? "✅ Yes" : "❌ No"}
          </p>

          <div className="mt-4 p-4 bg-white rounded border">
            <p className="font-semibold">Second Carousel Will Show:</p>
            {saleProducts.success && saleProducts.data.length >= 1 ? (
              <p className="text-green-600">🎯 Special Offers (Sale Products)</p>
            ) : newArrivals.success && newArrivals.data.length >= 1 ? (
              <p className="text-blue-600">🆕 New Arrivals</p>
            ) : themedProducts.success && themedProducts.data.length >= 1 ? (
              <p className="text-purple-600">🎨 Designer Collection</p>
            ) : (
              <p className="text-gray-600">📋 Staff Picks (Fallback)</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
