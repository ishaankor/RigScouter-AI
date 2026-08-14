const dbItems = [
  { id: "comp-rtx-5060-amazon", component_name: "GIGABYTE GeForce RTX 5060", retailer: "Amazon", current_price: 300 },
  { id: "comp-rtx-5060-b-h", component_name: "MSI GeForce RTX 5060", retailer: "B&H", current_price: 310 },
  { id: "comp-rtx-5060-ebay", component_name: "PNY GeForce RTX 5060", retailer: "eBay", current_price: 290 },
  { id: "comp-rtx-5060-micro-center", component_name: "NVIDIA GeForce RTX 5060", retailer: "Micro Center", current_price: 299 },
  { id: "comp-rtx-5060-newegg", component_name: "GIGABYTE WINDFORCE GeForce RTX 5060", retailer: "Newegg", current_price: 708.09 }
];

const groupedMap = new Map();

dbItems.forEach((item) => {
  let key = item.component_name?.toLowerCase().trim();
  if (item.id) {
    const retailerSlug = item.retailer?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (retailerSlug && item.id.endsWith(`-${retailerSlug}`)) {
      key = item.id.slice(0, -(retailerSlug.length + 1));
    } else if (item.id.startsWith('comp-')) {
      key = item.id;
    }
  }
  if (!key) return;
  
  if (!groupedMap.has(key)) {
    groupedMap.set(key, { ...item, RetailerOffers: [] });
  }
  
  const group = groupedMap.get(key);
  group.RetailerOffers.push({
    id: item.id,
    retailer: item.retailer,
    price: item.current_price
  });
});

console.log(JSON.stringify(Array.from(groupedMap.entries()), null, 2));
