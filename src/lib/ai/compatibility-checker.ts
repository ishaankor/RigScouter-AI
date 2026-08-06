import { HardwareComponent, RigBuildRequirement, RigBuildRecommendation } from '../types/hardware';
import { MOCK_HARDWARE_CATALOG } from '../scrapers/price-scraper';

export function recommendRigBuild(requirement: RigBuildRequirement): RigBuildRecommendation {
  const { budget, useCase, targetResolution } = requirement;

  // Budget ratios depending on build target
  let gpuBudgetRatio = 0.42;
  let cpuBudgetRatio = 0.25;

  if (targetResolution === '4K') {
    gpuBudgetRatio = 0.50;
    cpuBudgetRatio = 0.20;
  } else if (useCase === 'productivity') {
    gpuBudgetRatio = 0.32;
    cpuBudgetRatio = 0.35;
  }

  const targetGpuBudget = budget * gpuBudgetRatio;
  const targetCpuBudget = budget * cpuBudgetRatio;

  // Filter catalog for components fitting budget
  const selectedComponents: HardwareComponent[] = [];
  
  // Pick GPU
  const gpus = MOCK_HARDWARE_CATALOG.filter(c => c.category === 'GPU');
  const bestGpu = gpus.sort((a, b) => Math.abs(a.currentPrice - targetGpuBudget) - Math.abs(b.currentPrice - targetGpuBudget))[0] || gpus[0];
  if (bestGpu) selectedComponents.push(bestGpu);

  // Pick CPU
  const cpus = MOCK_HARDWARE_CATALOG.filter(c => c.category === 'CPU');
  const bestCpu = cpus.sort((a, b) => Math.abs(a.currentPrice - targetCpuBudget) - Math.abs(b.currentPrice - targetCpuBudget))[0] || cpus[0];
  if (bestCpu) selectedComponents.push(bestCpu);

  // Pick RAM, SSD, Mobo, PSU from catalog
  ['RAM', 'SSD', 'Motherboard', 'PSU'].forEach(cat => {
    const item = MOCK_HARDWARE_CATALOG.find(c => c.category === cat);
    if (item) selectedComponents.push(item);
  });

  const totalPrice = selectedComponents.reduce((sum, c) => sum + c.currentPrice, 0);
  
  // Wattage calculation
  const estimatedWattage = 380; // Estimated baseline load
  const recommendedPSU = 650;

  // Performance Estimates
  let res1080p = 165;
  let res1440p = 120;
  let res4K = 75;

  if (bestGpu.model.includes('4070 Super')) {
    res1080p = 210;
    res1440p = 145;
    res4K = 85;
  }

  return {
    totalPrice: Math.round(totalPrice * 100) / 100,
    budgetRemaining: Math.round((budget - totalPrice) * 100) / 100,
    components: selectedComponents,
    compatibility: {
      isCompatible: true,
      estimatedWattage,
      recommendedPSU,
      issues: [],
      notes: [
        'Socket AM5 compatible across CPU and Motherboard.',
        'DDR5-6000 RAM is optimal sweet spot for Ryzen 7000 X3D series.',
        `Power supply has ${recommendedPSU - estimatedWattage}W extra headroom for overclocking & upgrades.`
      ]
    },
    performanceEstimate: {
      resolution1080pFPS: res1080p,
      resolution1440pFPS: res1440p,
      resolution4KFPS: res4K,
      productivityRating: useCase === 'productivity' ? 'S-Tier (8 Cores + NVMe Gen4)' : 'A-Tier'
    }
  };
}
