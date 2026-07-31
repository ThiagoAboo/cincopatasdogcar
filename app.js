// site/app.js - Application Logic for Cinco Patas Dog Car & Walker

// --- Default Settings ---
const DEFAULT_SETTINGS = {
  brand: "Cinco Patas Dog Car & Walker",
  brand_short: "Cinco Patas",
  whatsapp_number: "5521992244753",
  phone_display: "(21) 99224-4753",
  instagram_handle: "@cincopatasdogcar",
  city_base: "Alcântara, São Gonçalo (RJ)",
  base_coords: { lat: -22.8160, lon: -43.0080 }, // Alcântara, São Gonçalo
  cities_covered: ["São Gonçalo", "Niterói", "Maricá", "Itaboraí"],
  schedule_display: "Todos os dias, 7h às 19h",
  fuel_cost_per_km: 0.30,
  fuel_cost_markup_percent: 0.50,
  taxi_per_km_pet: 2.50,
  taxi_per_km_human: 0.50,
  taxi_min_price: 25,
  walker_min_price: 30,
  walker_travel_fee_per_km_over: 1.50,
  walker_travel_fee_km_threshold: 5,
  wait_time_free_min: 30,
  wait_time_fee: 10,
  wait_time_fee_min_block: 15,
  hygiene_fee_min: 50,
  hygiene_fee_max: 150,
  combo_taxi_base_km: 5,
  combo_aventurinha_discount: 0.15,
  combo_vip_discount: 0.25,
  monthly_pkg_discount: 0.20,
  taxi_second_pet_discount: 0.50,
  walker_second_pet_discount: 0.50,
  max_pets: 3,
  cancel_free_hours: 24,
  porte_options: [
    { id: "pequeno", label: "Pequeno", weight: "Até 10 kg" },
    { id: "medio", label: "Médio", weight: "11–25 kg" },
    { id: "grande", label: "Grande", weight: "26–45 kg" },
    { id: "gigante", label: "Gigante", weight: "45 kg +" }
  ],
  monthly_tiers: [
    { tier: "1x por semana", freq: 1, label: "4 serviços / mês" },
    { tier: "2x por semana", freq: 2, label: "8 serviços / mês", accent: true },
    { tier: "3x por semana", freq: 3, label: "12 serviços / mês" }
  ],
  walk_time_options: [
    { min: 30, label: "30 min", factor: 0.6 },
    { min: 60, label: "1 hora", factor: 1.0 },
    { min: 90, label: "1h30", factor: 1.4 }
  ],
  cidades: [
    {
      nome: "Niterói",
      walker_price_by_porte: { pequeno: 32.5, medio: 37.5, grande: 45, gigante: 57.5 },
      taxi_multiplier_by_porte: { pequeno: 1, medio: 1.1, grande: 1.25, gigante: 1.5 },
      parques: [
        { nome: "Campo de São Bento", latitude: -22.9011, longitude: -43.1097 },
        { nome: "Horto do Fonseca", latitude: -22.8808, longitude: -43.0903 },
        { nome: "Horto de Itaipu", latitude: -22.9405, longitude: -43.0321 },
        { nome: "Horto do Barreto", latitude: -22.8753, longitude: -43.1058 },
        { nome: "Parque da Cidade de Niterói", latitude: -22.9234, longitude: -43.0852 }
      ]
    },
    {
      nome: "Maricá",
      walker_price_by_porte: { pequeno: 32.5, medio: 37.5, grande: 45, gigante: 57.5 },
      taxi_multiplier_by_porte: { pequeno: 1, medio: 1.1, grande: 1.25, gigante: 1.5 },
      parques: [
        { nome: "Orla da Lagoa de Araçatiba", latitude: -22.9239, longitude: -42.8256 },
        { nome: "Orla de Itaipuaçu", latitude: -22.9722, longitude: -42.9247 },
        { nome: "Praça Orlando de Barros Pimentel", latitude: -22.9192, longitude: -42.8183 },
        { nome: "Parque Linear de Inoã", latitude: -22.9272, longitude: -42.9103 }
      ]
    },
    {
      nome: "São Gonçalo",
      walker_price_by_porte: { pequeno: 32.5, medio: 37.5, grande: 45, gigante: 57.5 },
      taxi_multiplier_by_porte: { pequeno: 1, medio: 1.1, grande: 1.25, gigante: 1.5 },
      parques: [
        { nome: "Praça dos Ex-Combatentes", latitude: -22.8153, longitude: -43.0536 },
        { nome: "Praça do Gradim", latitude: -22.8092, longitude: -43.0728 },
        { nome: "Praça de Neves", latitude: -22.8317, longitude: -43.0894 },
        { nome: "Praça da Trindade", latitude: -22.8114, longitude: -43.0353 }
      ]
    },
    {
      nome: "Itaboraí",
      walker_price_by_porte: { pequeno: 32.5, medio: 37.5, grande: 45, gigante: 57.5 },
      taxi_multiplier_by_porte: { pequeno: 1, medio: 1.1, grande: 1.25, gigante: 1.5 },
      parques: [
        { nome: "Praça Marechal Floriano Peixoto", latitude: -22.7444, longitude: -42.8594 }
      ]
    }
  ]
};

const settings = { ...DEFAULT_SETTINGS };

async function loadSettingsFromPhysicalFile() {
  try {
    const res = await fetch("./settings.json?v=" + Date.now(), { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      delete data.walker_price_by_porte;
      delete data.taxi_multiplier_by_porte;
      if (data.taxi_per_km_human === 3 || data.taxi_per_km_human === 3.00) {
        data.taxi_per_km_human = 0.50;
      }
      Object.assign(settings, DEFAULT_SETTINGS, data);
      settings.base_coords = { lat: -22.8160, lon: -43.0080 };
      localStorage.setItem("app_settings_cache", JSON.stringify(settings));
    }
  } catch (e) {
    const cached = localStorage.getItem("app_settings_cache") || localStorage.getItem("app_settings");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        Object.assign(settings, DEFAULT_SETTINGS, parsed);
      } catch (err) {}
    }
  }
  return settings;
}

function getSettings() {
  return settings;
}

// Tenta pré-carregar imediatamente caso fetch funcione
loadSettingsFromPhysicalFile();

// --- Helper Functions ---
const BRL = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const round2 = (n) => Math.round(n * 100) / 100;
const waLink = (msg) => `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(msg)}`;

// --- Nominatim & OSRM Geocoding ---
async function searchAddresses(q) {
  const query = q.trim();
  if (query.length < 3) return [];
  const bias = /rj|rio de janeiro|brasil/i.test(query) ? query : `${query}, Rio de Janeiro, Brasil`;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=br&addressdetails=1&q=${encodeURIComponent(bias)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((d) => ({
      label: d.display_name,
      lat: parseFloat(d.lat),
      lon: parseFloat(d.lon),
    }));
  } catch (e) {
    return [];
  }
}

async function geocodeAddress(address) {
  const list = await searchAddresses(address);
  return list.length ? { lat: list[0].lat, lon: list[0].lon } : null;
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(s1 + s2), Math.sqrt(1 - (s1 + s2)));
  return Math.round(R * c * 1.25 * 10) / 10;
}

async function getRoadDistance(a, b) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("OSRM failed");
    const data = await res.json();
    if (!data.routes || !data.routes.length) throw new Error("No route found");
    const meters = data.routes[0].distance;
    return Math.round((meters / 1000) * 10) / 10;
  } catch (e) {
    return haversineKm(a, b);
  }
}

function validateAddress(v) {
  const s = v.trim();
  if (s.length < 4) return "Endereço muito curto — informe rua e bairro.";
  if (!/[A-Za-zÀ-ÿ]{3,}/.test(s)) return "Informe o nome da rua com pelo menos 3 letras.";
  return null;
}

// Global State
let currentTaxiResult = null;
let currentWalkerResult = null;
let rjCities = [];
let cityDistricts = [];

// Setup Custom Autocomplete Dropdowns
function setupCustomAutocompletes() {
  const setupInput = (inputId, dropdownId) => {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    if (!input || !dropdown) return;
    let timer = null;

    input.addEventListener("input", () => {
      if (timer) clearTimeout(timer);
      const val = input.value.trim();
      if (val.length < 3) {
        dropdown.innerHTML = "";
        dropdown.classList.add("hidden");
        return;
      }
      timer = setTimeout(async () => {
        const suggestions = await searchAddresses(val);
        if (!suggestions.length) {
          dropdown.innerHTML = "";
          dropdown.classList.add("hidden");
          return;
        }
        dropdown.innerHTML = suggestions.map(s => {
          const cleanAddr = s.label.replace(/"/g, '&quot;');
          return `<div class="cursor-pointer px-3.5 py-2.5 text-xs text-white bg-navy hover:bg-navy-deep hover:text-gold transition flex items-center gap-2 border-b border-white/10 last:border-0" data-address="${cleanAddr}">
            <i data-lucide="map-pin" class="h-3.5 w-3.5 text-gold shrink-0"></i>
            <span class="truncate text-white font-medium">${s.label}</span>
          </div>`;
        }).join("");
        dropdown.classList.remove("hidden");
        refreshIcons();

        dropdown.querySelectorAll("[data-address]").forEach(item => {
          item.addEventListener("click", (e) => {
            e.stopPropagation();
            input.value = item.getAttribute("data-address");
            dropdown.innerHTML = "";
            dropdown.classList.add("hidden");
          });
        });
      }, 350);
    });

    document.addEventListener("click", (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add("hidden");
      }
    });
  };

  setupInput("taxi-pickup", "taxi-pickup-dropdown");
  setupInput("taxi-destination", "taxi-destination-dropdown");
  setupInput("walk-local", "walk-local-dropdown");
}

function refreshIcons() {
  if (window.lucide && typeof lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}

function toggleMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  if (menu) {
    menu.classList.toggle("hidden");
  }
}

// --- Multi-Pet Management State ---
let taxiPetsList = [];
let walkerPetsList = [];
let comboPetsList = [];

function addTaxiPet() {
  const maxPets = settings.max_pets || 3;
  const currentCount = taxiPetsList.length > 0 ? taxiPetsList.length : 1;
  if (currentCount >= maxPets && taxiPetsList.length >= maxPets) return;

  const selectedPorte = document.querySelector('input[name="taxi-porte"]:checked')?.value || "medio";
  if (taxiPetsList.length === 0) {
    taxiPetsList.push({ porte: selectedPorte });
  } else {
    taxiPetsList.push({ porte: selectedPorte });
  }
  renderTaxiPetsList();
}

function removeTaxiPet(index) {
  taxiPetsList.splice(index, 1);
  renderTaxiPetsList();
}

function renderTaxiPetsList() {
  const container = document.getElementById("taxi-pets-list");
  const addBtn = document.getElementById("btn-add-taxi-pet");
  const maxPets = settings.max_pets || 3;
  const currentCount = taxiPetsList.length > 0 ? taxiPetsList.length : 1;

  if (addBtn) {
    if (currentCount >= maxPets) {
      addBtn.classList.add("hidden");
    } else {
      addBtn.classList.remove("hidden");
    }
  }

  if (!container) return;
  if (taxiPetsList.length === 0) {
    container.innerHTML = "";
    return;
  }
  const secondPetDisc = settings.taxi_second_pet_discount || 0.50;
  container.innerHTML = taxiPetsList.map((pet, idx) => {
    const label = settings.porte_options.find(p => p.id === pet.porte)?.label || pet.porte;
    const petNum = idx + 1;
    const badgeText = idx === 0 ? "Pet #1 (Valor cheio)" : `Pet #${petNum} (${Math.round(secondPetDisc * 100)}% OFF)`;
    return `
      <div class="flex items-center justify-between px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white">
        <div class="flex items-center gap-2">
          <i data-lucide="paw-print" class="h-3.5 w-3.5 text-gold"></i>
          <span class="font-semibold">Porte ${label}</span>
          <span class="px-2 py-0.5 rounded-full ${idx === 0 ? 'bg-gold/20 text-gold' : 'bg-emerald-500/20 text-emerald-300'} text-[10px] font-bold">${badgeText}</span>
        </div>
        <button type="button" onclick="removeTaxiPet(${idx})" class="text-white/60 hover:text-red-400 p-1 transition cursor-pointer" title="Remover Pet">
          <i data-lucide="trash-2" class="h-4 w-4"></i>
        </button>
      </div>
    `;
  }).join("");
  refreshIcons();
}

function addWalkerPet() {
  const maxPets = settings.max_pets || 3;
  const currentCount = walkerPetsList.length > 0 ? walkerPetsList.length : 1;
  if (currentCount >= maxPets && walkerPetsList.length >= maxPets) return;

  const selectedPorte = document.querySelector('input[name="walker-porte"]:checked')?.value || "medio";
  if (walkerPetsList.length === 0) {
    walkerPetsList.push({ porte: selectedPorte });
  } else {
    walkerPetsList.push({ porte: selectedPorte });
  }
  renderWalkerPetsList();
}

function removeWalkerPet(index) {
  walkerPetsList.splice(index, 1);
  renderWalkerPetsList();
}

function renderWalkerPetsList() {
  const container = document.getElementById("walker-pets-list");
  const addBtn = document.getElementById("btn-add-walker-pet");
  const maxPets = settings.max_pets || 3;
  const currentCount = walkerPetsList.length > 0 ? walkerPetsList.length : 1;

  if (addBtn) {
    if (currentCount >= maxPets) {
      addBtn.classList.add("hidden");
    } else {
      addBtn.classList.remove("hidden");
    }
  }

  if (!container) return;
  if (walkerPetsList.length === 0) {
    container.innerHTML = "";
    return;
  }
  const secondPetDisc = settings.walker_second_pet_discount || 0.50;
  container.innerHTML = walkerPetsList.map((pet, idx) => {
    const label = settings.porte_options.find(p => p.id === pet.porte)?.label || pet.porte;
    const petNum = idx + 1;
    const badgeText = idx === 0 ? "Pet #1 (Valor cheio)" : `Pet #${petNum} (${Math.round(secondPetDisc * 100)}% OFF)`;
    return `
      <div class="flex items-center justify-between px-3 py-2 rounded-xl bg-navy/10 border border-navy/20 text-xs text-navy">
        <div class="flex items-center gap-2">
          <i data-lucide="paw-print" class="h-3.5 w-3.5 text-navy"></i>
          <span class="font-semibold">Porte ${label}</span>
          <span class="px-2 py-0.5 rounded-full ${idx === 0 ? 'bg-navy/20 text-navy' : 'bg-emerald-600/20 text-emerald-700'} text-[10px] font-bold">${badgeText}</span>
        </div>
        <button type="button" onclick="removeWalkerPet(${idx})" class="text-navy/60 hover:text-red-600 p-1 transition cursor-pointer" title="Remover Pet">
          <i data-lucide="trash-2" class="h-4 w-4"></i>
        </button>
      </div>
    `;
  }).join("");
  refreshIcons();
}

function addComboPet() {
  const maxPets = settings.max_pets || 3;
  const currentCount = comboPetsList.length > 0 ? comboPetsList.length : 1;
  if (currentCount >= maxPets && comboPetsList.length >= maxPets) return;

  const selectedPorte = document.querySelector('input[name="combo-porte"]:checked')?.value || "pequeno";
  if (comboPetsList.length === 0) {
    comboPetsList.push({ porte: selectedPorte });
  } else {
    comboPetsList.push({ porte: selectedPorte });
  }
  renderComboPetsList();
  renderCombos();
}

function removeComboPet(index) {
  comboPetsList.splice(index, 1);
  renderComboPetsList();
  renderCombos();
}

function renderComboPetsList() {
  const container = document.getElementById("combo-pets-list");
  const addBtn = document.getElementById("btn-add-combo-pet");
  const maxPets = settings.max_pets || 3;
  const currentCount = comboPetsList.length > 0 ? comboPetsList.length : 1;

  if (addBtn) {
    if (currentCount >= maxPets) {
      addBtn.classList.add("hidden");
    } else {
      addBtn.classList.remove("hidden");
    }
  }

  if (!container) return;
  if (comboPetsList.length === 0) {
    container.innerHTML = "";
    return;
  }
  const secondPetDisc = settings.taxi_second_pet_discount || 0.50;
  container.innerHTML = comboPetsList.map((pet, idx) => {
    const label = settings.porte_options.find(p => p.id === pet.porte)?.label || pet.porte;
    const petNum = idx + 1;
    const badgeText = idx === 0 ? "Pet #1 (Valor cheio)" : `Pet #${petNum} (${Math.round(secondPetDisc * 100)}% OFF)`;
    return `
      <div class="flex items-center justify-between px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white">
        <div class="flex items-center gap-2">
          <i data-lucide="paw-print" class="h-3.5 w-3.5 text-gold"></i>
          <span class="font-semibold">Porte ${label}</span>
          <span class="px-2 py-0.5 rounded-full ${idx === 0 ? 'bg-gold/20 text-gold' : 'bg-emerald-500/20 text-emerald-300'} text-[10px] font-bold">${badgeText}</span>
        </div>
        <button type="button" onclick="removeComboPet(${idx})" class="text-white/60 hover:text-red-400 p-1 transition cursor-pointer" title="Remover Pet">
          <i data-lucide="trash-2" class="h-4 w-4"></i>
        </button>
      </div>
    `;
  }).join("");
  refreshIcons();
}

// --- Taxi Calculator Handler ---
async function handleTaxiCalc() {
  const tripType = document.querySelector('input[name="taxi-trip"]:checked')?.value || "ida";
  const withHuman = document.querySelector('input[name="taxi-human"]:checked')?.value === "true";
  const pickup = document.getElementById("taxi-pickup")?.value || "";
  const destination = document.getElementById("taxi-destination")?.value || "";

  const pickupErr = validateAddress(pickup);
  const destErr = validateAddress(destination);
  const errContainer = document.getElementById("taxi-error");

  if (pickupErr || destErr) {
    if (errContainer) errContainer.innerText = pickupErr || destErr;
    return;
  }
  if (errContainer) errContainer.innerText = "";

  const btn = document.getElementById("btn-calc-taxi");
  if (btn) btn.innerHTML = "Calculando...";

  const pCoord = await geocodeAddress(pickup);
  const dCoord = await geocodeAddress(destination);

  if (!pCoord || !dCoord) {
    if (btn) btn.innerHTML = "Calcular Valor Estimado";
    if (errContainer) errContainer.innerText = "Endereço não localizado. Verifique rua, número e bairro.";
    return;
  }

  const distToPickupOneWay = await getRoadDistance(settings.base_coords, pCoord);
  const distToPickupFuel = tripType === "ida_volta" ? distToPickupOneWay * 2 : distToPickupOneWay;
  const distTripOneWay = await getRoadDistance(pCoord, dCoord);

  if (btn) btn.innerHTML = "Calcular Valor Estimado";

  const matchedCityTaxi = getCityDataFromAddress(pickup) || getCityDataFromAddress(destination);
  const cityObjTaxi = matchedCityTaxi || (getCidadesData()[0] || {});
  const taxiMultipliers = (cityObjTaxi && cityObjTaxi.taxi_multiplier_by_porte)
    ? cityObjTaxi.taxi_multiplier_by_porte
    : { pequeno: 1, medio: 1.1, grande: 1.25, gigante: 1.5 };

  // Determine list of pets to calculate
  const selectedRadioPorte = document.querySelector('input[name="taxi-porte"]:checked')?.value || "medio";
  const petsToCalc = taxiPetsList.length > 0 ? taxiPetsList : [{ porte: selectedRadioPorte }];

  const secondPetDisc = settings.taxi_second_pet_discount || 0.50;
  const basePerKm = settings.taxi_per_km_pet;
  const petFuelRate = settings.fuel_cost_per_km * (1 + (settings.fuel_cost_markup_percent || 0.50));
  const distTrip = tripType === "ida_volta" ? distTripOneWay * 2 : distTripOneWay;
  const fuelCost = round2(distToPickupFuel * settings.fuel_cost_per_km);
  const humanRate = settings.taxi_per_km_human ?? 0.50;
  const humanFee = withHuman ? round2(distTrip * humanRate) : 0;

  let petsDetailed = [];
  let sumFullPetsTripCost = 0;
  let totalSecondPetDiscount = 0;

  petsToCalc.forEach((p, idx) => {
    const pLabel = settings.porte_options.find(opt => opt.id === p.porte)?.label || p.porte;
    const porteMult = taxiMultipliers[p.porte] || 1;
    const perKmPet = (basePerKm + petFuelRate) * porteMult;
    const fullPetTripCost = round2(distTrip * perKmPet);
    const isSecondPet = idx > 0;

    let disc = 0;
    if (isSecondPet) {
      disc = round2(fullPetTripCost * secondPetDisc);
      totalSecondPetDiscount = round2(totalSecondPetDiscount + disc);
    }
    sumFullPetsTripCost = round2(sumFullPetsTripCost + fullPetTripCost);
    petsDetailed.push({
      porte: p.porte,
      porteLabel: pLabel,
      fullCost: fullPetTripCost,
      discount: disc,
      finalCost: round2(fullPetTripCost - disc),
      isSecondPet
    });
  });

  const netPetsTripCost = round2(sumFullPetsTripCost - totalSecondPetDiscount);
  const minTotal = round2(settings.taxi_min_price + fuelCost);
  const total = Math.max(round2(fuelCost + netPetsTripCost + humanFee), minTotal);

  const primaryPorteLabel = petsDetailed.map(p => p.porteLabel).join(", ");

  currentTaxiResult = {
    pets: petsDetailed,
    porteLabel: primaryPorteLabel,
    distToPickup: distToPickupOneWay,
    distToPickupFuel,
    distTrip: Math.round(distTrip * 10) / 10,
    fuelCost,
    humanFee,
    sumFullPetsTripCost,
    totalSecondPetDiscount,
    netPetsTripCost,
    withHuman,
    tripType,
    total,
    pickup,
    destination
  };

  renderTaxiResult(currentTaxiResult);
  updateMonthlyTaxi();
  checkComboUnlock();
}

function renderTaxiResult(res) {
  const container = document.getElementById("taxi-result-container");
  if (!container) return;

  const petsStr = res.pets.map((p, i) => `Pet #${i + 1} (${p.porteLabel})`).join(", ");
  const msg = `Olá! Gostaria de agendar um *Táxi Dog* pela ${settings.brand}.\n\n` +
    `🐶 Pets: ${petsStr}\n` +
    `🔁 Modalidade: ${res.tripType === "ida_volta" ? "Ida e Volta" : "Somente Ida"}\n` +
    `👤 Humano junto: ${res.withHuman ? "Sim" : "Não"}\n` +
    `📍 Partida: ${res.pickup}\n` +
    `🎯 Destino: ${res.destination}\n` +
    `📏 Distância trajeto: ${res.distTrip} km\n` +
    `💰 Valor estimado: ${BRL(res.total)}\n\n` +
    `Podemos confirmar o horário?`;

  const link = waLink(msg);

  container.innerHTML = `
    <div class="flex flex-col h-full text-left w-full">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
        <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Orçamento detalhado</span>
        <div class="flex flex-wrap gap-1.5">
          <span class="px-2.5 py-1 rounded-full bg-navy text-white text-xs font-medium flex items-center gap-1">
            <i data-lucide="paw-print" class="h-3 w-3 text-gold"></i> ${res.pets.length} ${res.pets.length > 1 ? "Pets" : "Pet"}
          </span>
          <span class="px-2.5 py-1 rounded-full bg-gold-gradient text-navy text-xs font-bold flex items-center gap-1 shadow-sm">
            <i data-lucide="refresh-cw" class="h-3 w-3"></i> ${res.tripType === "ida_volta" ? "Ida e Volta" : "Somente Ida"}
          </span>
          ${res.withHuman ? `<span class="px-2.5 py-1 rounded-full bg-navy text-white text-xs font-medium flex items-center gap-1"><i data-lucide="users" class="h-3 w-3 text-gold"></i> + Humano</span>` : ""}
        </div>
      </div>
      <ul class="space-y-3 text-sm mb-4">
        <li class="flex justify-between items-center border-b border-border pb-3 text-left">
          <div class="text-left flex items-start gap-2">
            <i data-lucide="navigation" class="h-4 w-4 text-gold shrink-0 mt-0.5"></i>
            <div>
              <span class="font-semibold text-navy block text-left">Taxa de chegada até o Pet</span>
              <span class="text-xs text-muted-foreground block text-left mt-0.5">Deslocamento inicial até o local de partida</span>
            </div>
          </div>
          <span class="font-semibold text-navy shrink-0 ml-2">${BRL(res.fuelCost)}</span>
        </li>
        ${res.withHuman ? `
          <li class="flex justify-between items-center border-b border-border pb-3 text-left">
            <div class="text-left flex items-start gap-2">
              <i data-lucide="user" class="h-4 w-4 text-gold shrink-0 mt-0.5"></i>
              <div>
                <span class="font-semibold text-navy block text-left">Carona do humano</span>
                <span class="text-xs text-muted-foreground block text-left mt-0.5">Acompanhamento do tutor no trajeto · ${res.distTrip} km</span>
              </div>
            </div>
            <span class="font-semibold text-navy shrink-0 ml-2">${BRL(res.humanFee)}</span>
          </li>
        ` : ""}
        ${res.pets.map((p, idx) => `
          <li class="flex justify-between items-center border-b border-border pb-3 text-left">
            <div class="text-left flex items-start gap-2">
              <i data-lucide="paw-print" class="h-4 w-4 text-gold shrink-0 mt-0.5"></i>
              <div>
                <span class="font-semibold text-navy block text-left">Pet #${idx + 1} (${p.porteLabel})</span>
                <span class="text-xs text-muted-foreground block text-left mt-0.5">${res.tripType === "ida_volta" ? "Ida + Volta" : "Cliente ➔ Destino"} · ${res.distTrip} km</span>
              </div>
            </div>
            <div class="text-right shrink-0 ml-2">
              ${p.isSecondPet ? `
                <div class="text-xs text-navy/70 line-through decoration-emerald-500 font-semibold mb-0.5">${BRL(p.fullCost)}</div>
                <div class="flex items-center justify-end gap-1.5">
                  <span class="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-extrabold text-[11px]">(${Math.round((settings.taxi_second_pet_discount || 0.50) * 100)}% OFF)</span>
                  <span class="font-bold text-emerald-700 text-sm">${BRL(p.finalCost)}</span>
                </div>
              ` : `
                <span class="font-semibold text-navy">${BRL(p.fullCost)}</span>
              `}
            </div>
          </li>
        `).join("")}
      </ul>
      <div class="rounded-xl bg-navy p-5 text-white mb-4 text-left shadow-elegant">
        <div class="flex items-center justify-between gap-2">
          <div class="text-xs uppercase tracking-wider text-white/70">Valor Total Estimado</div>
          ${res.totalSecondPetDiscount > 0 ? `<div class="text-sm text-white/70 line-through decoration-emerald-400 font-bold">${BRL(res.total + res.totalSecondPetDiscount)}</div>` : ""}
        </div>
        <div class="font-display text-4xl font-extrabold text-gold mt-1">${BRL(res.total)}</div>
        ${res.totalSecondPetDiscount > 0 ? `
          <div class="mt-2 text-xs text-emerald-400 font-medium flex items-center gap-1.5">
            <i data-lucide="sparkles" class="h-3.5 w-3.5 text-emerald-400"></i>
            <span>Desconto concedido para mais de um cãozinho da mesma casa</span>
          </div>
        ` : ""}
      </div>
      <p class="text-xs text-muted-foreground mb-4 leading-relaxed text-left flex items-start gap-1.5">
        <i data-lucide="alert-circle" class="h-4 w-4 text-gold shrink-0 mt-0.5"></i>
        <span><strong>Nota:</strong> Taxa de higienização <strong>não está inclusa</strong> — só será cobrada em caso de incidente higiênico (xixi, cocô ou vômito). Primeiros 30 min de espera grátis.</span>
      </p>
      <a href="${link}" target="_blank" rel="noreferrer" class="w-full">
        <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow h-10 px-8 w-full bg-whatsapp hover:opacity-90 text-white font-semibold shadow-md">
          <i data-lucide="message-square" class="h-4 w-4"></i>
          <span>Confirmar e Agendar via WhatsApp</span>
        </button>
      </a>
    </div>
  `;
  refreshIcons();
}

// --- Walker Calculator Handler ---
async function handleWalkerCalc() {
  const minutes = parseInt(document.querySelector('input[name="walker-minutes"]:checked')?.value || "60");
  const local = document.getElementById("walk-local")?.value || "";

  const err = validateAddress(local);
  const errContainer = document.getElementById("walker-error");

  if (err) {
    if (errContainer) errContainer.innerText = err;
    return;
  }
  if (errContainer) errContainer.innerText = "";

  const btn = document.getElementById("btn-calc-walker");
  if (btn) btn.innerHTML = "Calculando...";

  const coord = await geocodeAddress(local);
  if (!coord) {
    if (btn) btn.innerHTML = "Simular Passeio";
    if (errContainer) errContainer.innerText = "Endereço não localizado. Tente com rua, número e bairro.";
    return;
  }

  const distOneWay = await getRoadDistance(settings.base_coords, coord);
  if (btn) btn.innerHTML = "Simular Passeio";

  const matchedCityWalker = getCityDataFromAddress(local);
  const cityObjWalker = matchedCityWalker || (getCidadesData()[0] || {});
  const walkerPrices = (cityObjWalker && cityObjWalker.walker_price_by_porte)
    ? cityObjWalker.walker_price_by_porte
    : { pequeno: 32.5, medio: 37.5, grande: 45, gigante: 57.5 };

  const secondPetDisc = settings.walker_second_pet_discount || 0.50;
  const timeOpt = settings.walk_time_options.find(t => t.min === minutes) || { factor: 1 };
  const travelFee = round2(distOneWay * settings.fuel_cost_per_km);

  const selectedRadioPorte = document.querySelector('input[name="walker-porte"]:checked')?.value || "medio";
  const petsToCalc = walkerPetsList.length > 0 ? walkerPetsList : [{ porte: selectedRadioPorte }];

  let petsDetailed = [];
  let sumFullPetsWalkCost = 0;
  let totalSecondPetDiscount = 0;

  petsToCalc.forEach((p, idx) => {
    const pLabel = settings.porte_options.find(opt => opt.id === p.porte)?.label || p.porte;
    const hourlyRate = walkerPrices[p.porte] || 32.5;
    // Fuel to client is embedded in the paseo price (idx === 0 gets travelFee embedded)
    const fullWalkPrice = round2(hourlyRate * timeOpt.factor + (idx === 0 ? travelFee : 0));
    const isSecondPet = idx > 0;

    let disc = 0;
    if (isSecondPet) {
      disc = round2(fullWalkPrice * secondPetDisc);
      totalSecondPetDiscount = round2(totalSecondPetDiscount + disc);
    }
    sumFullPetsWalkCost = round2(sumFullPetsWalkCost + fullWalkPrice);
    petsDetailed.push({
      porte: p.porte,
      porteLabel: pLabel,
      fullCost: fullWalkPrice,
      discount: disc,
      finalCost: round2(fullWalkPrice - disc),
      isSecondPet
    });
  });

  const netPetsWalkCost = round2(sumFullPetsWalkCost - totalSecondPetDiscount);
  const minTotal = round2(settings.walker_min_price + travelFee);
  const total = Math.max(netPetsWalkCost, minTotal);
  const primaryPorteLabel = petsDetailed.map(p => p.porteLabel).join(", ");

  currentWalkerResult = {
    pets: petsDetailed,
    porteLabel: primaryPorteLabel,
    minutes,
    local,
    distOneWay,
    travelFee,
    sumFullPetsWalkCost,
    totalSecondPetDiscount,
    netPetsWalkCost,
    total
  };

  renderWalkerResult(currentWalkerResult);
  updateMonthlyWalker();
  checkComboUnlock();
}

function renderWalkerResult(res) {
  const container = document.getElementById("walker-result-container");
  if (!container) return;

  const petsStr = res.pets.map((p, i) => `Pet #${i + 1} (${p.porteLabel})`).join(", ");
  const msg = `Olá! Gostaria de agendar um *Passeio Dog Walker* pela ${settings.brand}.\n\n` +
    `🐶 Pets: ${petsStr}\n` +
    `⏱️ Duração: ${res.minutes} min\n` +
    `📍 Local do encontro: ${res.local}\n` +
    `💰 Valor estimado: ${BRL(res.total)}\n\n` +
    `Podemos confirmar dia e horário?`;

  const link = waLink(msg);

  container.innerHTML = `
    <div class="flex flex-col h-full text-left w-full">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
        <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Orçamento do passeio</span>
        <div class="flex flex-wrap gap-1.5">
          <span class="px-2.5 py-1 rounded-full bg-navy text-white text-xs font-medium flex items-center gap-1">
            <i data-lucide="paw-print" class="h-3 w-3 text-gold"></i> ${res.pets.length} ${res.pets.length > 1 ? "Pets" : "Pet"}
          </span>
          <span class="px-2.5 py-1 rounded-full bg-gold-gradient text-navy text-xs font-bold flex items-center gap-1 shadow-sm">
            <i data-lucide="clock" class="h-3 w-3"></i> ${res.minutes} min
          </span>
        </div>
      </div>
      <ul class="space-y-3 text-sm mb-4">
        ${res.pets.map((p, idx) => `
          <li class="flex justify-between items-center border-b border-border pb-3 text-left">
            <div class="text-left flex items-start gap-2">
              <i data-lucide="paw-print" class="h-4 w-4 text-gold shrink-0 mt-0.5"></i>
              <div>
                <span class="font-semibold text-navy block text-left">Pet #${idx + 1} (${p.porteLabel})</span>
                <span class="text-xs text-muted-foreground block text-left mt-0.5">Duração ${res.minutes} min · Deslocamento incluso</span>
              </div>
            </div>
            <div class="text-right shrink-0 ml-2">
              ${p.isSecondPet ? `
                <div class="text-xs text-navy/70 line-through decoration-emerald-500 font-semibold mb-0.5">${BRL(p.fullCost)}</div>
                <div class="flex items-center justify-end gap-1.5">
                  <span class="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-extrabold text-[11px]">(${Math.round((settings.walker_second_pet_discount || 0.50) * 100)}% OFF)</span>
                  <span class="font-bold text-emerald-700 text-sm">${BRL(p.finalCost)}</span>
                </div>
              ` : `
                <span class="font-semibold text-navy">${BRL(p.fullCost)}</span>
              `}
            </div>
          </li>
        `).join("")}
      </ul>
      <div class="rounded-xl bg-navy p-5 text-white mb-4 text-left shadow-elegant">
        <div class="flex items-center justify-between gap-2">
          <div class="text-xs uppercase tracking-wider text-white/70">Valor Total Estimado</div>
          ${res.totalSecondPetDiscount > 0 ? `<div class="text-sm text-white/70 line-through decoration-emerald-400 font-bold">${BRL(res.total + res.totalSecondPetDiscount)}</div>` : ""}
        </div>
        <div class="font-display text-4xl font-extrabold text-gold mt-1">${BRL(res.total)}</div>
        ${res.totalSecondPetDiscount > 0 ? `
          <div class="mt-2 text-xs text-emerald-400 font-medium flex items-center gap-1.5">
            <i data-lucide="sparkles" class="h-3.5 w-3.5 text-emerald-400"></i>
            <span>Desconto concedido para mais de um cãozinho da mesma casa</span>
          </div>
        ` : ""}
      </div>
      <a href="${link}" target="_blank" rel="noreferrer" class="w-full">
        <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow h-10 px-8 w-full bg-whatsapp hover:opacity-90 text-white font-semibold shadow-md">
          <i data-lucide="message-square" class="h-4 w-4"></i>
          <span>Agendar Passeio no WhatsApp</span>
        </button>
      </a>
    </div>
  `;
  refreshIcons();
}

// --- Monthly Packages Updates ---
function updateMonthlyTaxi() {
  const container = document.getElementById("monthly-taxi-container");
  if (!container) return;
  if (!currentTaxiResult) {
    container.innerHTML = "";
    return;
  }
  const unit = currentTaxiResult.total;

  container.innerHTML = `
    <div class="mt-10">
      <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div class="text-xs font-semibold uppercase tracking-wider text-gold">Pacotes mensais recorrentes</div>
          <h3 class="font-display text-2xl font-bold text-navy">Táxi Dog</h3>
          <p class="text-sm text-muted-foreground mt-1">
            Valores calculados com base na sua corrida simulada (${Math.round(settings.monthly_pkg_discount * 100)}% off).
          </p>
        </div>
        <div class="rounded-full bg-gold-gradient px-4 py-1.5 text-xs font-bold text-navy shadow-sm">
          🎉 ${Math.round((settings.taxi_second_pet_discount || 0.50) * 100)}% OFF no 2º cãozinho da mesma casa!
        </div>
      </div>
      <div class="grid gap-5 md:grid-cols-3">
        ${settings.monthly_tiers.map(m => {
    const total = round2(unit * m.freq * 4 * (1 - settings.monthly_pkg_discount));
    const priceStr = BRL(total);
    const msg = `Olá! Quero assinar o *Plano Mensal de Táxi Dog ${m.tier}* (${m.label}) — ${priceStr}/mês.\n\n` +
      `🐶 Porte: ${currentTaxiResult.porteLabel}\n` +
      `📍 Partida: ${currentTaxiResult.pickup}\n` +
      `🎯 Destino: ${currentTaxiResult.destination}\n` +
      `🔁 Modalidade: ${currentTaxiResult.tripType === "ida_volta" ? "Ida e Volta" : "Somente Ida"}`;
    return `
            <div class="rounded-xl border p-6 bg-white shadow-elegant ${m.accent ? 'border-2 border-gold ring-1 ring-gold' : ''}">
              <div class="flex items-center gap-2 mb-2">
                <span class="font-display text-lg font-bold text-navy">${m.tier}</span>
              </div>
              <p class="text-xs text-muted-foreground mb-3">${m.label}</p>
              <div class="text-3xl font-extrabold text-navy mb-4">${priceStr}<span class="text-xs text-muted-foreground font-normal"> /mês</span></div>
              <a href="${waLink(msg)}" target="_blank" class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow h-10 px-8 w-full rounded-md font-semibold ${m.accent ? 'bg-navy text-white hover:bg-navy-deep' : 'bg-gold-gradient text-navy hover:opacity-95'}">
                Assinar ${m.tier}
              </a>
            </div>
          `;
  }).join("")}
      </div>
    </div>
  `;
}

function updateMonthlyWalker() {
  const container = document.getElementById("monthly-walker-container");
  if (!container) return;
  if (!currentWalkerResult) {
    container.innerHTML = "";
    return;
  }
  const unit = currentWalkerResult.total;

  container.innerHTML = `
    <div class="mt-10">
      <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div class="text-xs font-semibold uppercase tracking-wider text-gold">Pacotes mensais recorrentes</div>
          <h3 class="font-display text-2xl font-bold text-navy">Passeios (Dog Walker)</h3>
          <p class="text-sm text-muted-foreground mt-1">
            Valores calculados com base no seu passeio simulado (${Math.round(settings.monthly_pkg_discount * 100)}% off).
          </p>
        </div>
        <div class="rounded-full bg-gold-gradient px-4 py-1.5 text-xs font-bold text-navy shadow-sm">
          🎉 ${Math.round((settings.walker_second_pet_discount || 0.50) * 100)}% OFF no 2º cãozinho da mesma casa!
        </div>
      </div>
      <div class="grid gap-5 md:grid-cols-3">
        ${settings.monthly_tiers.map(m => {
    const total = round2(unit * m.freq * 4 * (1 - settings.monthly_pkg_discount));
    const priceStr = BRL(total);
    const msg = `Olá! Quero assinar o *Plano Mensal de Passeios ${m.tier}* (${m.label}) — ${priceStr}/mês.\n\n` +
      `🐶 Porte: ${currentWalkerResult.porteLabel}\n` +
      `📍 Local: ${currentWalkerResult.local}\n` +
      `⏱ Duração: ${currentWalkerResult.minutes} min`;
    return `
            <div class="rounded-xl border p-6 bg-white shadow-elegant ${m.accent ? 'border-2 border-gold ring-1 ring-gold' : ''}">
              <div class="flex items-center gap-2 mb-2">
                <span class="font-display text-lg font-bold text-navy">${m.tier}</span>
              </div>
              <p class="text-xs text-muted-foreground mb-3">${m.label}</p>
              <div class="text-3xl font-extrabold text-navy mb-4">${priceStr}<span class="text-xs text-muted-foreground font-normal"> /mês</span></div>
              <a href="${waLink(msg)}" target="_blank" class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow h-10 px-8 w-full rounded-md font-semibold ${m.accent ? 'bg-navy text-white hover:bg-navy-deep' : 'bg-gold-gradient text-navy hover:opacity-95'}">
                Assinar ${m.tier}
              </a>
            </div>
          `;
  }).join("")}
      </div>
    </div>
  `;
}

// --- Cities & Neighborhoods API Integration ---
const RJ_BAIRROS_MAP = {
  "São Gonçalo": [
    "Alcântara", "Barro Vermelho", "Boa Vista", "Brasilândia", "Centro", "Colubandê",
    "Engenho do Assunção", "Galo Branco", "Gradim", "Icaraí", "Itaúna", "Jardim Catarina",
    "Laranjal", "Mangueira", "Maria Paula", "Mutondo", "Neves", "Pacheco", "Parada 40",
    "Paraíso", "Pita", "Porto da Pedra", "Porto Novo", "Rocha", "Santa Catarina",
    "Santa Isabel", "Trindade", "Venda da Cruz", "Vila Lage", "Vista Alegre", "Zé Garoto"
  ],
  "Niterói": [
    "Badu", "Bairro de Fátima", "Baldeador", "Barreto", "Boa Viagem", "Cachoeiras",
    "Camboinhas", "Cantagalo", "Caramujo", "Centro", "Charitas", "Cubango", "Engenho do Mato",
    "Fonseca", "Gragoatá", "Icaraí", "Ilha da Conceição", "Ingá", "Itacoatiara", "Itaipu",
    "Ititioca", "Jardim Imbuí", "Jurujuba", "Largo da Batalha", "Maceió", "Maria Paula",
    "Matapaca", "Ponta d'Areia", "Piratininga", "Pendotiba", "Rio do Ouro", "Santa Bárbara",
    "Santa Rosa", "São Domingos", "São Francisco", "Sapê", "Tenente Jardim", "Vila Progresso"
  ],
  "Maricá": [
    "Araçatiba", "Bambuí", "Barra de Maricá", "Boqueirão", "Cordeirinho", "Centro",
    "Espraiado", "Flamengo", "Guaratiba", "Inoã", "Itaipuaçu", "Itapeba", "Jacaroá",
    "Mumbuca", "Parque Kaestrel", "Ponta Negra", "Recanto de Itaipuaçu", "São José do Imbassaí",
    "Spar", "Ubatiba"
  ],
  "Itaboraí": [
    "Ampliação", "Cabuçu", "Centro", "Engenho Velho", "Itambi", "Jardim Ferraz",
    "Manilha", "Marambaia", "Nova Cidade", "Pacheco", "Porto das Caixas", "Retiro",
    "Sambaetiba", "Santo Antônio", "Venda das Pedras", "Visconde"
  ],
  "Rio de Janeiro": [
    "Alto da Boa Vista", "Anchieta", "Bangu", "Barra da Tijuca", "Barra de Guaratiba",
    "Botafogo", "Bonsucesso", "Campo Grande", "Catete", "Centro", "Copacabana", "Cosme Velho",
    "Flamengo", "Freguesia (Jacarepaguá)", "Gávea", "Glória", "Grajaú", "Humaitá",
    "Ipanema", "Itanhangá", "Jacarepaguá", "Jardim Botânico", "Laranjeiras", "Leblon",
    "Leme", "Madureira", "Maracanã", "Méier", "Penha", "Recreio dos Bandeirantes",
    "Santa Teresa", "São Conrado", "São Cristóvão", "Taquara", "Tijuca", "Urca",
    "Vila da Penha", "Vila Isabel", "Vargem Grande", "Vargem Pequena"
  ]
};

// --- Cidades, Multiplicadores e Parques ---
function getCidadesData() {
  const s = getSettings();
  return (s && s.cidades && s.cidades.length) ? s.cidades : DEFAULT_SETTINGS.cidades;
}

function getCityDataFromAddress(addr) {
  if (!addr) return null;
  const list = getCidadesData();
  for (const c of list) {
    if (new RegExp(`\\b${c.nome}\\b`, "i").test(addr)) return c;
  }
  return null;
}

function updateParkSelect() {
  const parkSelect = document.getElementById("combo-park");
  if (!parkSelect) return;
  const currentVal = parkSelect.value;
  const list = getCidadesData();

  let parquesToDisplay = [];
  list.forEach(c => {
    if (c.parques) {
      c.parques.forEach(p => parquesToDisplay.push({ ...p, cidade: c.nome }));
    }
  });

  let html = `<option value="" class="text-slate-900 bg-white">Nenhum parque (Passeio local no bairro)</option>`;
  parquesToDisplay.forEach(p => {
    const lat = p.latitude || p.lat;
    const lon = p.longitude || p.lon;
    const key = `${p.cidade}||${p.nome}||${lat}||${lon}`;
    const selected = currentVal === key ? "selected" : "";
    html += `<option value="${key}" ${selected} class="text-slate-900 bg-white">${p.nome} (${p.cidade})</option>`;
  });

  parkSelect.innerHTML = html;
}

async function fetchNeighborhoodsForCity(cityName) {
  let list = RJ_BAIRROS_MAP[cityName] || [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityName)}&state=Rio+de+Janeiro&country=Brasil&format=json&addressdetails=1&limit=50`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const apiBairros = data
        .map(d => d.address?.suburb || d.address?.neighbourhood || d.name)
        .filter(Boolean);
      const combined = Array.from(new Set([...list, ...apiBairros]));
      if (combined.length > 0) return combined.sort((a, b) => a.localeCompare(b));
    }
  } catch (e) { }
  return list.length ? list.sort((a, b) => a.localeCompare(b)) : ["Centro", "Região Única"];
}

async function setupIBGECities() {
  const citySelect = document.getElementById("combo-city");
  if (!citySelect) return;

  const covered = (settings.cities_covered && settings.cities_covered.length)
    ? settings.cities_covered
    : ["São Gonçalo", "Niterói", "Maricá", "Itaboraí"];

  rjCities = covered.map((nome, id) => ({ id, nome }));

  citySelect.innerHTML = `<option value="" class="text-slate-900 bg-white">Selecione uma cidade...</option>` +
    rjCities.map(c => `<option value="${c.nome}" class="text-slate-900 bg-white">${c.nome}</option>`).join("");

  updateParkSelect();

  citySelect.addEventListener("change", async (e) => {
    const cityName = e.target.value;
    const neighborhoodSelect = document.getElementById("combo-neighborhood");

    if (!neighborhoodSelect) return;

    if (!cityName) {
      neighborhoodSelect.innerHTML = `<option value="" class="text-slate-900 bg-white">Selecione a cidade primeiro</option>`;
      neighborhoodSelect.disabled = true;
      renderCombos();
      return;
    }

    neighborhoodSelect.innerHTML = `<option value="" class="text-slate-900 bg-white">Carregando bairros...</option>`;
    neighborhoodSelect.disabled = true;

    const bairros = await fetchNeighborhoodsForCity(cityName);
    neighborhoodSelect.innerHTML = `<option value="" class="text-slate-900 bg-white">Selecione um bairro...</option>` +
      bairros.map(b => `<option value="${b}" class="text-slate-900 bg-white">${b}</option>`).join("");
    neighborhoodSelect.disabled = false;
    renderCombos();
  });

  const neighborhoodSelect = document.getElementById("combo-neighborhood");
  if (neighborhoodSelect) {
    neighborhoodSelect.addEventListener("change", renderCombos);
  }
  const parkSelect = document.getElementById("combo-park");
  if (parkSelect) {
    parkSelect.addEventListener("change", renderCombos);
  }
  document.querySelectorAll('input[name="combo-porte"]').forEach(r => {
    r.addEventListener("change", renderCombos);
  });
}

function checkComboUnlock() {
  renderCombos();
}

async function renderCombos() {
  const container = document.getElementById("combos-cards-container");
  if (!container) return;

  const city = document.getElementById("combo-city")?.value;
  const neighborhood = document.getElementById("combo-neighborhood")?.value;
  const parkValue = document.getElementById("combo-park")?.value;
  const porte = document.querySelector('input[name="combo-porte"]:checked')?.value || "pequeno";
  const porteLabel = settings.porte_options.find(p => p.id === porte)?.label || porte;

  if (!city || !neighborhood) {
    container.innerHTML = `
      <div class="mt-12 rounded-2xl bg-white/5 p-8 text-center text-white/70">
        Selecione sua cidade e bairro acima para ver os preços dos Combos calculados para a sua localização.
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="mt-12 text-center text-amber-400 font-medium">
      Calculando rota para ${neighborhood}, ${city} (Porte ${porteLabel})...
    </div>
  `;

  // Matched City Data for multipliers
  const allCitiesData = getCidadesData();
  const cityData = allCitiesData.find(c => c.nome.toLowerCase() === city.trim().toLowerCase()) || (allCitiesData[0] || {});
  const taxiMultipliers = (cityData && cityData.taxi_multiplier_by_porte)
    ? cityData.taxi_multiplier_by_porte
    : { pequeno: 1, medio: 1.1, grande: 1.25, gigante: 1.5 };
  const walkerPrices = (cityData && cityData.walker_price_by_porte)
    ? cityData.walker_price_by_porte
    : { pequeno: 32.5, medio: 37.5, grande: 45, gigante: 57.5 };

  // Geocode neighborhood
  const searchAddress = `${neighborhood}, ${city}, Rio de Janeiro, Brasil`;
  const coord = await geocodeAddress(searchAddress);
  let distToPickupOneWay = 5;
  if (coord) {
    const roadDist = await getRoadDistance(settings.base_coords, coord);
    if (roadDist !== null) distToPickupOneWay = Math.max(settings.base_min_pickup_km || 5, Math.ceil(roadDist));
  }
  const distToPickupFuel = round2(distToPickupOneWay * (settings.base_pickup_fuel_factor || 0.70));
  const fuelFee = round2(distToPickupFuel * settings.fuel_cost_per_km);
  const petFuelRate = settings.fuel_cost_per_km * (1 + (settings.fuel_cost_markup_percent || 0.50));

  // Check selected park
  let selectedPark = null;
  let distParque = 0;
  if (parkValue) {
    const parts = parkValue.split("||");
    if (parts.length === 4) {
      selectedPark = {
        cidade: parts[0],
        nome: parts[1],
        lat: parseFloat(parts[2]),
        lon: parseFloat(parts[3])
      };
      if (coord) {
        distParque = await getRoadDistance(coord, { lat: selectedPark.lat, lon: selectedPark.lon });
      } else {
        distParque = haversineKm({ lat: -22.816, lon: -43.008 }, { lat: selectedPark.lat, lon: selectedPark.lon });
      }
    }
  }

  // Multi-Pet calculation in Combos
  const selectedRadioPorteCombo = document.querySelector('input[name="combo-porte"]:checked')?.value || "pequeno";
  const comboPetsToCalc = comboPetsList.length > 0 ? comboPetsList : [{ porte: selectedRadioPorteCombo }];
  const taxiSecondDiscCombo = settings.taxi_second_pet_discount || 0.50;
  const walkerSecondDiscCombo = settings.walker_second_pet_discount || 0.50;

  const taxiOneWayKm = selectedPark ? Math.max(5, distParque) : (settings.combo_taxi_base_km || 5);
  const taxiTripKm = round2(taxiOneWayKm * 2); // Round trip (ida e volta)

  let sumFullTaxi = 0;
  let sumFullWalker = 0;
  let secondaryPetTaxiDisc = 0;
  let secondaryPetWalkerDisc = 0;
  let comboPetLabels = [];

  comboPetsToCalc.forEach((p, idx) => {
    const pLabel = settings.porte_options.find(opt => opt.id === p.porte)?.label || p.porte;
    comboPetLabels.push(pLabel);

    const perKmTaxi = (settings.taxi_per_km_pet + petFuelRate) * (taxiMultipliers[p.porte] || 1);
    const fullPetTaxiTrip = round2(taxiTripKm * perKmTaxi);

    const walkBasePrice = walkerPrices[p.porte] || 32.5;
    const fullPetWalkerPrice = round2(walkBasePrice + fuelFee);

    if (idx > 0) {
      secondaryPetTaxiDisc = round2(secondaryPetTaxiDisc + (fullPetTaxiTrip * taxiSecondDiscCombo));
      secondaryPetWalkerDisc = round2(secondaryPetWalkerDisc + (fullPetWalkerPrice * walkerSecondDiscCombo));
    }

    sumFullTaxi = round2(sumFullTaxi + fullPetTaxiTrip);
    sumFullWalker = round2(sumFullWalker + fullPetWalkerPrice);
  });

  const netTaxiTrip = round2(sumFullTaxi - secondaryPetTaxiDisc);
  const netWalkerPrice = round2(sumFullWalker - secondaryPetWalkerDisc);

  const taxiPrice = Math.max(round2(settings.taxi_min_price + fuelFee), round2(fuelFee + netTaxiTrip));
  const walkerPrice = Math.max(round2(settings.walker_min_price + fuelFee), netWalkerPrice);

  const comboSum = round2(taxiPrice + walkerPrice);
  const aventurinhaTotal = round2(comboSum * (1 - settings.combo_aventurinha_discount));
  const vipTotal = round2(comboSum * 4 * (1 - settings.combo_vip_discount));

  const aventurinhaPrice = BRL(aventurinhaTotal);
  const vipPrice = BRL(vipTotal);

  const petsSubtitle = comboPetsToCalc.length > 1
    ? `${comboPetsToCalc.length} Pets (${comboPetLabels.join(" + ")})`
    : `Porte ${comboPetLabels[0]}`;

  // Checklist Item texts (Requirement 5: remove 5km text when park is selected)
  let itemTaxiText = "";
  let itemWalkerText = "";
  let itemParkText = "";
  let noteText = "";

  if (selectedPark) {
    itemTaxiText = `Busca com Táxi Dog partindo de ${neighborhood}`;
    itemWalkerText = `1h de passeio Dog Walker no ${selectedPark.nome}`;
    itemParkText = `Destino: ${selectedPark.nome} (${distParque} km de distância)`;
    noteText = `* Inclui deslocamento de ${distParque} km de ${neighborhood} até o ${selectedPark.nome}`;
  } else {
    itemTaxiText = `Busca com Táxi Dog (até ${taxiOneWayKm} km inclusos) partindo de ${neighborhood}`;
    itemWalkerText = `1h de passeio Dog Walker para ${petsSubtitle}`;
    itemParkText = `Parque a sua escolha (com limite de 5km de distância)`;
    noteText = `* Para um parque acima de 5km será necessário consulta`;
  }

  const parkParam = selectedPark ? ` no *${selectedPark.nome}* (${distParque} km)` : "";

  container.innerHTML = `
    <div class="mt-12 grid gap-6 md:grid-cols-2">
      <!-- Combo Aventurinha -->
      <div class="rounded-xl shadow relative overflow-hidden border-0 p-8 bg-white/[0.06] text-white backdrop-blur flex flex-col justify-between">
        <div>
          <div class="text-xs font-semibold uppercase tracking-wider text-gold">Combo Especial · ${neighborhood}</div>
          <h3 class="mt-1 font-display text-2xl font-bold">Combo Aventurinha</h3>
          <div class="mt-3 text-xs font-semibold text-white/70">Calculado para ${neighborhood} · ${petsSubtitle}${selectedPark ? ` · ${selectedPark.nome}` : ""}</div>
          <div class="mt-3 flex items-baseline gap-2">
            <div class="font-display text-4xl font-extrabold text-white">${aventurinhaPrice}</div>
            <div class="text-sm text-white/80">/ por aventura</div>
          </div>
          <ul class="mt-6 space-y-3 text-sm text-white/90">
            <li class="flex items-start gap-2.5">
              <div class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold text-navy shadow-sm mt-0.5"><i data-lucide="check" class="h-3 w-3 stroke-[3]"></i></div>
              <span>${itemTaxiText}</span>
            </li>
            <li class="flex items-start gap-2.5">
              <div class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold text-navy shadow-sm mt-0.5"><i data-lucide="check" class="h-3 w-3 stroke-[3]"></i></div>
              <span>${itemWalkerText}</span>
            </li>
            <li class="flex items-start gap-2.5">
              <div class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold text-navy shadow-sm mt-0.5"><i data-lucide="check" class="h-3 w-3 stroke-[3]"></i></div>
              <span>${itemParkText}</span>
            </li>
            <li class="flex items-start gap-2.5">
              <div class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold text-navy shadow-sm mt-0.5"><i data-lucide="check" class="h-3 w-3 stroke-[3]"></i></div>
              <span>Devolução em casa com segurança</span>
            </li>
            <li class="flex items-start gap-2.5">
              <div class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold text-navy shadow-sm mt-0.5"><i data-lucide="check" class="h-3 w-3 stroke-[3]"></i></div>
              <span>${Math.round(settings.combo_aventurinha_discount * 100)}% de desconto sobre o valor cheio (${BRL(comboSum)})</span>
            </li>
          </ul>
          <div class="mt-4 text-xs text-white/50 italic">${noteText}</div>
        </div>
        <a href="${waLink(`Olá! Tenho interesse no *Combo Aventurinha* (${aventurinhaPrice}) para ${city} - ${neighborhood} (${petsSubtitle})${parkParam}.`)}" target="_blank" class="mt-6 inline-block w-full">
          <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow h-9 px-4 py-2 w-full bg-gold-gradient font-semibold text-navy hover:opacity-95">Quero este plano</button>
        </a>
      </div>

      <!-- Combo VIP Mensal -->
      <div class="rounded-xl shadow relative overflow-hidden border-0 p-8 bg-gold-gradient text-navy shadow-gold flex flex-col justify-between">
        <span class="absolute right-4 top-4 rounded-full bg-navy px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold">Mais escolhido</span>
        <div>
          <div class="text-xs font-semibold uppercase tracking-wider text-navy/80">Assinatura · ${neighborhood}</div>
          <h3 class="mt-1 font-display text-2xl font-bold text-navy">Combo VIP Mensal</h3>
          <div class="mt-3 text-xs font-semibold text-navy/80">Calculado para ${neighborhood} · ${petsSubtitle}${selectedPark ? ` · ${selectedPark.nome}` : ""}</div>
          <div class="mt-3 flex items-baseline gap-2">
            <div class="font-display text-4xl font-extrabold text-navy">${vipPrice}</div>
            <div class="text-sm text-navy/80">/ por mês</div>
          </div>
          <ul class="mt-6 space-y-3 text-sm text-navy font-medium">
            <li class="flex items-start gap-2.5">
              <div class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-navy text-gold shadow-sm mt-0.5"><i data-lucide="check" class="h-3 w-3 stroke-[3]"></i></div>
              <span>Todos os benefícios do Combo Aventurinha</span>
            </li>
            <li class="flex items-start gap-2.5">
              <div class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-navy text-gold shadow-sm mt-0.5"><i data-lucide="check" class="h-3 w-3 stroke-[3]"></i></div>
              <span>4 aventurinha mensais${selectedPark ? ` com parque (${selectedPark.nome})` : ""}</span>
            </li>
            <li class="flex items-start gap-2.5">
              <div class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-navy text-gold shadow-sm mt-0.5"><i data-lucide="check" class="h-3 w-3 stroke-[3]"></i></div>
              <span>${Math.round(settings.combo_vip_discount * 100)}% de desconto mensal (${BRL(round2(comboSum * 4))} sem desconto)</span>
            </li>
          </ul>
          <div class="mt-4 text-xs text-navy/70 italic">${noteText}</div>
        </div>
        <a href="${waLink(`Olá! Tenho interesse no *Combo VIP Mensal* (${vipPrice}) para ${city} - ${neighborhood} (${petsSubtitle})${parkParam}.`)}" target="_blank" class="mt-6 inline-block w-full">
          <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow h-9 px-4 py-2 w-full bg-navy font-semibold text-white hover:bg-navy-deep">Quero este plano</button>
        </a>
      </div>
    </div>
  `;
  refreshIcons();
}

// Accordion Toggle
function setupAccordion() {
  document.querySelectorAll(".accordion-trigger").forEach(trigger => {
    trigger.addEventListener("click", () => {
      const item = trigger.closest(".accordion-item");
      if (item) {
        item.classList.toggle("active");
      }
    });
  });
}

// Global Initialization
document.addEventListener("DOMContentLoaded", async () => {
  await loadSettingsFromPhysicalFile();
  setupCustomAutocompletes();
  setupAccordion();
  setupIBGECities();
  updateMonthlyTaxi();
  updateMonthlyWalker();
  refreshIcons();
});
