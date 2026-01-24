import { getProductSample } from "@/lib/services/product-services";

export default async function ProductsSchemaDebugPage() {
  const sampleProducts = await getProductSample(5);

  if (sampleProducts.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Products Schema Debug</h1>
        <p className="text-red-500">No products found or error occurred</p>
      </div>
    );
  }

  // Analyze the schema
  const allFields = new Set<string>();
  sampleProducts.forEach(product => {
    Object.keys(product).forEach(key => allFields.add(key));
  });

  const fieldsArray = Array.from(allFields).sort();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Products Schema Analysis</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Schema Overview */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-black">Available Fields ({fieldsArray.length})</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {fieldsArray.map(field => (
              <div key={field} className="p-2 bg-gray-50 rounded">
                <code className="text-blue-600">{field}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Fields Check */}
        <div className="bg-white p-6 rounded-lg shadow text-black">
          <h2 className="text-xl font-semibold mb-4 text-black">Filter Fields Status</h2>
          <div className="space-y-3">
            {[
              { field: "designThemes", required: "Theme filtering", type: "array" },
              { field: "onSale", required: "Sale filtering", type: "boolean" },
              { field: "price", required: "Price filtering", type: "number" },
              { field: "salePrice", required: "Sale price display", type: "number" },
              { field: "category", required: "Category filtering", type: "string" },
              { field: "categorySlug", required: "Category filtering", type: "string" },
              { field: "subcategory", required: "Subcategory filtering", type: "string" },
              { field: "subcategorySlug", required: "Subcategory filtering", type: "string" }
            ].map(({ field, required, type }) => (
              <div key={field} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <code className="font-mono text-sm">{field}</code>
                  <p className="text-xs text-gray-600">{required}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{type}</span>
                  {fieldsArray.includes(field) ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">✓ Found</span>
                  ) : (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">✗ Missing</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sample Products */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-black">Sample Products Data</h2>
        <div className="space-y-4">
          {sampleProducts.map((product, index) => (
            <details key={product.id} className="border rounded p-4">
              <summary className="cursor-pointer font-medium text-black">
                Product {index + 1}: {product.name || product.title || product.id}
              </summary>
              <pre className="mt-4 p-4 bg-gray-50 rounded text-xs overflow-auto text-black">
                {JSON.stringify(product, null, 2)}
              </pre>
            </details>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">Recommendations</h2>
        <div className="space-y-2 text-sm">
          {!fieldsArray.includes("designThemes") && (
            <p className="text-blue-700">
              • Add <code>designThemes</code> field as an array of strings for theme filtering
            </p>
          )}
          {!fieldsArray.includes("onSale") && (
            <p className="text-blue-700">
              • Add <code>onSale</code> field as a boolean for sale filtering
            </p>
          )}
          {!fieldsArray.includes("salePrice") && (
            <p className="text-blue-700">
              • Add <code>salePrice</code> field as a number for sale price display
            </p>
          )}
          {(!fieldsArray.includes("categorySlug") || !fieldsArray.includes("subcategorySlug")) && (
            <p className="text-blue-700">• Ensure slug fields exist for consistent filtering</p>
          )}
        </div>
      </div>
    </div>
  );
}
