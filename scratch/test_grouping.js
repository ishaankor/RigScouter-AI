const dbItems = [
  {
    id: "rtx-5060-micro-center",
    component_name: "ASUS Dual GeForce RTX 5060",
    retailer: "Micro Center",
    current_price: 299.99
  },
  {
    id: "rtx-5060-newegg",
    component_name: "GIGABYTE RTX 5060 Windforce",
    retailer: "Newegg",
    current_price: 319.99
  },
  {
    id: "random-uuid-1234",
    component_name: "RTX 5060",
    retailer: "Amazon",
    current_price: 300.00
  }
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
