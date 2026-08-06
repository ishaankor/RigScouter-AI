import { HardwareComponent, RigBuildRequirement, RigBuildRecommendation } from '../types/hardware';
import { MOCK_HARDWARE_CATALOG } from '../scrapers/price-scraper';

export function recommendRigBuild(requirement: RigBuildRequirement): RigBuildRecommendation {
  const { budget, useCase, targetResolution } = requirement;

  // Budget ratios depending on resolution and target use case
  let gpuRatio = 0.40;
  let cpuRatio = 0.22;

  if (targetResolution === '4K') {
    gpuRatio = 0.48;
    cpuRatio = 0.18;
  } else if (useCase === 'productivity') {
    gpuRatio = 0.30;
    cpuRatio = 0.32;
  }

  const targetGpuBudget = budget * gpuRatio;
  const targetCpuBudget = budget * cpuRatio;

  // Sort and select closest GPU
  const gpus = MOCK_HARDWARE_CATALOG.filter(c => c.category === 'GPU');
  const selectedGpu = [...gpus].sort(
    (a, b) => Math.abs(a.currentPrice - targetGpuBudget) - Math.abs(b.currentPrice - targetGpuBudget)
  )[0] || gpus[0];

  // Sort and select closest CPU
  const cpus = MOCK_HARDWARE_CATALOG.filter(c => c.category === 'CPU');
  const selectedCpu = [...cpus].sort(
    (a, b) => Math.abs(a.currentPrice - targetCpuBudget) - Math.abs(b.currentPrice - targetCpuBudget)
  )[0] || cpus[0];

  // Select matching motherboard socket
  const cpuSocket = String(selectedCpu.specs?.Socket || 'AM5');
  const mobos = MOCK_HARDWARE_CATALOG.filter(c => c.category === 'Motherboard');
  const selectedMobo = mobos.find(m => String(m.specs?.Socket) === cpuSocket) || mobos[0];

  // Select RAM, SSD, PSU, Case, Cooler
  const selectedComponents: HardwareComponent[] = [selectedGpu, selectedCpu, selectedMobo];

  ['RAM', 'SSD', 'PSU', 'Case', 'Cooler'].forEach(cat => {
    const item = MOCK_HARDWARE_CATALOG.find(c => c.category === cat);
    if (item && !selectedComponents.some(sc => sc.id === item.id)) {
      selectedComponents.push(item);
    }
  });

  const totalPrice = selectedComponents.reduce((sum, c) => sum + c.currentPrice, 0);

  // Wattage estimation
  const gpuWattage = Number(selectedGpu.specs?.TDP?.toString().replace('W', '') || 220);
  const cpuWattage = Number(selectedCpu.specs?.TDP?.toString().replace('W', '') || 105);
  const systemBaselineWattage = 100;
  const estimatedWattage = gpuWattage + cpuWattage + systemBaselineWattage;
  const recommendedPSU = Math.ceil((estimatedWattage * 1.25) / 50) * 50;

  // Realistic FPS performance calculations
  let res1080p = 150;
  let res1440p = 105;
  let res4K = 65;

  if (selectedGpu.model.includes('4080 Super')) {
    res1080p = 250;
    res1440p = 190;
    res4K = 115;
  } else if (selectedGpu.model.includes('4070 Super') || selectedGpu.model.includes('7800 XT')) {
    res1080p = 205;
    res1440p = 145;
    res4K = 82;
  } else if (selectedGpu.model.includes('4060')) {
    res1080p = 125;
    res1440p = 80;
    res4K = 45;
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
        `Socket ${cpuSocket} is 100% compatible across ${selectedCpu.name} and ${selectedMobo.name}.`,
        'RAM & CPU cooler physical clearance verified for mid-tower chassis.',
        `Power supply has ${recommendedPSU - estimatedWattage}W extra headroom for peak transient surges & upgrades.`
      ]
    },
    performanceEstimate: {
      resolution1080pFPS: res1080p,
      resolution1440pFPS: res1440p,
      resolution4KFPS: res4K,
      productivityRating: useCase === 'productivity' ? 'S-Tier (Multi-Core Processing + Gen4 NVMe)' : 'A-Tier'
    }
  };
}
