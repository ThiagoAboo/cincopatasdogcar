// site/app.js - Application Logic for Cinco Patas Dog Car & Walker

// --- Default Settings ---
const DEFAULT_SETTINGS = {
  brand: "Cinco Patas Dog Car & Walker",
  brand_short: "Cinco Patas",
  whatsapp_number: "5521992244753",
  phone_display: "(21) 99224-4753",
  instagram_handle: "@cincopatasdogcar",
  city_base: "Alcântara, São Gonçalo (RJ)",
  base_coords: { lat: -22.7876, lon: -43.0244 },
  cities_covered: ["São Gonçalo", "Niterói", "Maricá", "Itaboraí"],
  schedule_display: "Todos os dias, 7h às 19h",
  fuel_cost_per_km: 0.30,
  fuel_cost_markup_percent: 0.50,
  taxi_per_km_pet: 2.50,
  taxi_per_km_human: 3.00,
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
  second_pet_discount: 0.50,
  cancel_free_hours: 24,
  walker_price_by_porte: {
    pequeno: 32.5,
    medio: 37.5,
    grande: 45,
    gigante: 57.5
  },
  taxi_multiplier_by_porte: {
    pequeno: 1,
    medio: 1.1,
    grande: 1.25,
    gigante: 1.5
  },
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
  ]
};

function getSettings() {
  const stored = localStorage.getItem("app_settings");
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { }
  }
  return DEFAULT_SETTINGS;
}

const settings = getSettings();

// --- Helper Functions ---
const BRL = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const round2 = (n) => Math.round(n * 100) / 100;
const waLink = (msg) => `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(msg)}`;

// --- Nominatim & OSRM Geocoding ---
async function searchAddresses(q) {
  const query = q.trim();
  if (query.length < 4) return [];
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
  if (s.length < 8) return "Endereço muito curto — informe rua e bairro.";
  if (!/[A-Za-zÀ-ÿ]{3,}/.test(s)) return "Informe o nome da rua com pelo menos 3 letras.";
  const hasNumber = /\d{1,5}/.test(s);
  const hasComma = /,/.test(s);
  if (!hasNumber && !hasComma) return "Inclua o número do imóvel ou o bairro (separado por vírgula).";
  return null;
}

// Global State
let currentTaxiResult = null;
let currentWalkerResult = null;
let rjCities = [];
let cityDistricts = [];

// Dynamic Setup on DOM Loaded
document.addEventListener("DOMContentLoaded", () => {
  setupAddressDatalists();
  setupIBGECities();
  setupAccordion();
  refreshIcons();
});

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

// Setup Address Suggestion Datalists
function setupAddressDatalists() {
  const setupInput = (inputId, listId) => {
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);
    if (!input || !list) return;
    let timer = null;
    input.addEventListener("input", () => {
      if (timer) clearTimeout(timer);
      const val = input.value.trim();
      if (val.length < 4) { list.innerHTML = ""; return; }
      timer = setTimeout(async () => {
        const suggestions = await searchAddresses(val);
        list.innerHTML = suggestions.map(s => `<option value="${s.label}"></option>`).join("");
      }, 500);
    });
  };
  setupInput("taxi-pickup", "pickup-list");
  setupInput("taxi-destination", "destination-list");
  setupInput("walk-local", "walk-local-list");
}

// --- Taxi Calculator Handler ---
async function handleTaxiCalc() {
  const porte = document.querySelector('input[name="taxi-porte"]:checked')?.value || "medio";
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

  const basePerKm = withHuman ? settings.taxi_per_km_human : settings.taxi_per_km_pet;
  const petFuelRate = settings.fuel_cost_per_km * (1 + (settings.fuel_cost_markup_percent || 0.50));
  const perKm = (basePerKm + petFuelRate) * (settings.taxi_multiplier_by_porte[porte] || 1);
  const distTrip = tripType === "ida_volta" ? distTripOneWay * 2 : distTripOneWay;
  const fuelCost = round2(distToPickupFuel * settings.fuel_cost_per_km);
  const rawTripCost = round2(distTrip * perKm);
  const rawTotal = round2(fuelCost + rawTripCost);
  const minTotal = round2(settings.taxi_min_price + fuelCost);
  const total = Math.max(rawTotal, minTotal);
  const tripCost = round2(total - fuelCost);

  const porteLabel = settings.porte_options.find(p => p.id === porte)?.label || porte;

  currentTaxiResult = {
    porte, porteLabel, distToPickup: distToPickupOneWay, distToPickupFuel, distTrip: Math.round(distTrip * 10) / 10,
    fuelCost, tripCost, withHuman, tripType, total, pickup, destination
  };

  renderTaxiResult(currentTaxiResult);
  updateMonthlyTaxi();
  checkComboUnlock();
}

function renderTaxiResult(res) {
  const container = document.getElementById("taxi-result-container");
  if (!container) return;

  const msg = `Olá! Gostaria de agendar um *Táxi Dog* pela ${settings.brand}.\n\n` +
    `🐶 Porte: ${res.porteLabel}\n` +
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
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Orçamento detalhado</span>
        <div class="flex flex-wrap gap-1.5">
          <span class="px-2.5 py-1 rounded-full bg-slate-900 text-white text-xs font-medium flex items-center gap-1">
            <i data-lucide="paw-print" class="h-3 w-3 text-amber-400"></i> Porte ${res.porteLabel}
          </span>
          <span class="px-2.5 py-1 rounded-full bg-gold-gradient text-slate-900 text-xs font-bold flex items-center gap-1 shadow-sm">
            <i data-lucide="refresh-cw" class="h-3 w-3"></i> ${res.tripType === "ida_volta" ? "Ida e Volta" : "Somente Ida"}
          </span>
          ${res.withHuman ? `<span class="px-2.5 py-1 rounded-full bg-slate-900 text-white text-xs font-medium flex items-center gap-1"><i data-lucide="users" class="h-3 w-3 text-amber-400"></i> + Humano</span>` : ""}
        </div>
      </div>
      <ul class="space-y-3 text-sm mb-4">
        <li class="flex justify-between items-start border-b border-gray-200 pb-3 text-left">
          <div class="text-left flex items-start gap-2">
            <i data-lucide="fuel" class="h-4 w-4 text-amber-500 shrink-0 mt-0.5"></i>
            <div>
              <span class="font-semibold text-slate-900 block text-left">Combustível até você</span>
              <span class="text-xs text-gray-500 block text-left mt-0.5">Base ➔ Cliente ${res.tripType === "ida_volta" ? "(Ida e Volta)" : "(Somente Ida)"} · ${res.distToPickupFuel} km</span>
            </div>
          </div>
          <span class="font-semibold text-slate-900 shrink-0 ml-2">${BRL(res.fuelCost)}</span>
        </li>
        <li class="flex justify-between items-start border-b border-gray-200 pb-3 text-left">
          <div class="text-left flex items-start gap-2">
            <i data-lucide="navigation" class="h-4 w-4 text-amber-500 shrink-0 mt-0.5"></i>
            <div>
              <span class="font-semibold text-slate-900 block text-left">Trajeto ${res.withHuman ? "Pet + Humano" : "do Pet"}</span>
              <span class="text-xs text-gray-500 block text-left mt-0.5">${res.tripType === "ida_volta" ? "Ida + Volta" : "Cliente ➔ Destino"} · ${res.distTrip} km</span>
            </div>
          </div>
          <span class="font-semibold text-slate-900 shrink-0 ml-2">${BRL(res.tripCost)}</span>
        </li>
      </ul>
      <div class="rounded-2xl bg-slate-900 p-5 text-white mb-4 text-left shadow-lg">
        <div class="text-xs uppercase tracking-wider text-slate-400">Valor Total Estimado</div>
        <div class="text-4xl font-extrabold text-amber-400 mt-1">${BRL(res.total)}</div>
      </div>
      <p class="text-xs text-gray-500 mb-4 leading-relaxed text-left flex items-start gap-1.5">
        <i data-lucide="alert-circle" class="h-4 w-4 text-amber-500 shrink-0 mt-0.5"></i>
        <span><strong>Nota:</strong> Taxa de higienização <strong>não está inclusa</strong> — só será cobrada em caso de incidente higiênico (xixi, cocô ou vômito). Primeiros 30 min de espera grátis.</span>
      </p>
      <a href="${link}" target="_blank" rel="noreferrer" class="w-full">
        <button class="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg transition">
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
  const porte = document.querySelector('input[name="walker-porte"]:checked')?.value || "medio";
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

  const hourly = settings.walker_price_by_porte[porte] || 35;
  const timeOpt = settings.walk_time_options.find(t => t.min === minutes) || { factor: 1 };
  const walkPrice = hourly * timeOpt.factor;
  const travelFee = round2(distOneWay * settings.fuel_cost_per_km);

  const raw = round2(walkPrice + travelFee);
  const minTotal = round2(settings.walker_min_price + travelFee);
  const total = Math.max(raw, minTotal);
  const porteLabel = settings.porte_options.find(p => p.id === porte)?.label || porte;

  currentWalkerResult = {
    porte, porteLabel, minutes, local, hourly, distOneWay, travelFee, total
  };

  renderWalkerResult(currentWalkerResult);
  updateMonthlyWalker();
  checkComboUnlock();
}

function renderWalkerResult(res) {
  const container = document.getElementById("walker-result-container");
  if (!container) return;

  const msg = `Olá! Gostaria de agendar um *Passeio Dog Walker* pela ${settings.brand}.\n\n` +
    `🐶 Porte: ${res.porteLabel}\n` +
    `⏱️ Duração: ${res.minutes} min\n` +
    `📍 Local do encontro: ${res.local}\n` +
    `💰 Valor estimado: ${BRL(res.total)}\n\n` +
    `Podemos confirmar dia e horário?`;

  const link = waLink(msg);

  container.innerHTML = `
    <div class="flex flex-col h-full text-left w-full">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Orçamento do passeio</span>
        <div class="flex flex-wrap gap-1.5">
          <span class="px-2.5 py-1 rounded-full bg-slate-900 text-white text-xs font-medium flex items-center gap-1">
            <i data-lucide="paw-print" class="h-3 w-3 text-amber-400"></i> Porte ${res.porteLabel}
          </span>
          <span class="px-2.5 py-1 rounded-full bg-gold-gradient text-slate-900 text-xs font-bold flex items-center gap-1 shadow-sm">
            <i data-lucide="clock" class="h-3 w-3"></i> ${res.minutes} min
          </span>
        </div>
      </div>
      <ul class="space-y-3 text-sm mb-4">
        <li class="flex justify-between items-start border-b border-gray-200 pb-3 text-left">
          <div class="text-left flex items-start gap-2">
            <i data-lucide="footprints" class="h-4 w-4 text-amber-500 shrink-0 mt-0.5"></i>
            <div>
              <span class="font-semibold text-slate-900 block text-left">Valor do passeio</span>
              <span class="text-xs text-gray-500 block text-left mt-0.5">Duração ${res.minutes} min · Base ${BRL(res.hourly)}/h</span>
            </div>
          </div>
          <span class="font-semibold text-slate-900 shrink-0 ml-2">${BRL(res.total)}</span>
        </li>
      </ul>
      <div class="rounded-2xl bg-slate-900 p-5 text-white mb-4 text-left shadow-lg">
        <div class="text-xs uppercase tracking-wider text-slate-400">Valor Total Estimado</div>
        <div class="text-4xl font-extrabold text-amber-400 mt-1">${BRL(res.total)}</div>
      </div>
      <p class="text-xs text-gray-500 mb-4 leading-relaxed text-left flex items-start gap-1.5">
        <i data-lucide="alert-circle" class="h-4 w-4 text-amber-500 shrink-0 mt-0.5"></i>
        <span><strong>Nota:</strong> Taxa de higienização <strong>não está inclusa</strong> — só será cobrada se houver incidente higiênico durante o passeio.</span>
      </p>
      <a href="${link}" target="_blank" rel="noreferrer" class="w-full">
        <button class="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg transition">
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
  const unit = currentTaxiResult ? currentTaxiResult.total : settings.taxi_min_price;

  container.innerHTML = `
    <div class="mt-10">
      <div class="mb-6">
        <div class="text-xs font-semibold uppercase tracking-wider text-amber-500">Pacotes mensais recorrentes</div>
        <h3 class="font-display text-2xl font-bold text-slate-900">Táxi Dog</h3>
        <p class="text-sm text-gray-500 mt-1">
          ${currentTaxiResult ? `Valores calculados com base na sua última corrida simulada (${Math.round(settings.monthly_pkg_discount * 100)}% off).` : "Valores base — use a calculadora de Táxi Dog para personalizar."}
        </p>
      </div>
      <div class="grid gap-5 md:grid-cols-3">
        ${settings.monthly_tiers.map(m => {
    const total = round2(unit * m.freq * 4 * (1 - settings.monthly_pkg_discount));
    const priceStr = BRL(total);
    const msg = `Olá! Quero o *Plano Mensal de Táxi Dog ${m.tier}* (${m.label}) — ${priceStr}/mês.`;
    return `
            <div class="rounded-2xl border p-6 bg-white shadow-lg ${m.accent ? 'ring-2 ring-amber-400' : ''}">
              <div class="flex items-center gap-2 mb-2">
                <span class="font-display text-lg font-bold text-slate-900">${m.tier}</span>
              </div>
              <p class="text-xs text-gray-500 mb-3">${m.label}</p>
              <div class="text-3xl font-extrabold text-slate-900 mb-4">${priceStr}<span class="text-xs text-gray-400 font-normal"> /mês</span></div>
              <a href="${waLink(msg)}" target="_blank" class="block w-full text-center py-2.5 rounded-xl font-semibold text-sm ${m.accent ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-amber-400 text-slate-900 hover:bg-amber-500'}">
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
  const unit = currentWalkerResult ? currentWalkerResult.total : settings.walker_min_price;

  container.innerHTML = `
    <div class="mt-10">
      <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div class="text-xs font-semibold uppercase tracking-wider text-amber-500">Pacotes mensais recorrentes</div>
          <h3 class="font-display text-2xl font-bold text-slate-900">Passeios (Dog Walker)</h3>
          <p class="text-sm text-gray-500 mt-1">
            ${currentWalkerResult ? `Valores calculados com base no seu último passeio simulado (${Math.round(settings.monthly_pkg_discount * 100)}% off).` : "Valores base — use o simulador de passeio para personalizar."}
          </p>
        </div>
        <div class="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-bold text-slate-900 shadow">
          🎉 50% OFF no 2º cãozinho da mesma casa!
        </div>
      </div>
      <div class="grid gap-5 md:grid-cols-3">
        ${settings.monthly_tiers.map(m => {
    const total = round2(unit * m.freq * 4 * (1 - settings.monthly_pkg_discount));
    const priceStr = BRL(total);
    const msg = `Olá! Quero o *Plano Mensal de Passeios ${m.tier}* (${m.label}) — ${priceStr}/mês.`;
    return `
            <div class="rounded-2xl border p-6 bg-white shadow-lg ${m.accent ? 'ring-2 ring-amber-400' : ''}">
              <div class="flex items-center gap-2 mb-2">
                <span class="font-display text-lg font-bold text-slate-900">${m.tier}</span>
              </div>
              <p class="text-xs text-gray-500 mb-3">${m.label}</p>
              <div class="text-3xl font-extrabold text-slate-900 mb-4">${priceStr}<span class="text-xs text-gray-400 font-normal"> /mês</span></div>
              <a href="${waLink(msg)}" target="_blank" class="block w-full text-center py-2.5 rounded-xl font-semibold text-sm ${m.accent ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-amber-400 text-slate-900 hover:bg-amber-500'}">
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

  // Item 2: Geocode selected neighborhood and calculate distToPickup
  const searchAddress = `${neighborhood}, ${city}, Rio de Janeiro, Brasil`;
  const coord = await geocodeAddress(searchAddress);
  let distBairro = 5; // fallback
  if (coord) {
    const roadDist = await getRoadDistance(settings.base_coords, coord);
    if (roadDist !== null) distBairro = roadDist;
  }

  // Item 2: Fuel fee to neighborhood (single leg)
  const fuelFee = round2(distBairro * settings.fuel_cost_per_km);
  const petFuelRate = settings.fuel_cost_per_km * (1 + (settings.fuel_cost_markup_percent || 0.50));

  // Item 3: Calculate Taxi Dog for configured base km (default 5km) and pet size
  const taxiKm = settings.combo_taxi_base_km || 5;
  const perKmTaxi = (settings.taxi_per_km_pet + petFuelRate) * (settings.taxi_multiplier_by_porte[porte] || 1);
  const rawTaxiTrip = round2(taxiKm * perKmTaxi);
  const taxiPrice = Math.max(round2(settings.taxi_min_price + fuelFee), round2(fuelFee + rawTaxiTrip));

  // Item 4: Calculate Walker for pet size
  const walkBasePrice = settings.walker_price_by_porte[porte] || 32.5;
  const rawWalker = round2(walkBasePrice + fuelFee);
  const walkerPrice = Math.max(round2(settings.walker_min_price + fuelFee), rawWalker);

  // Item 5: Apply discounts
  const comboSum = round2(taxiPrice + walkerPrice);
  const aventurinhaTotal = round2(comboSum * (1 - settings.combo_aventurinha_discount));
  const vipTotal = round2(comboSum * 4 * (1 - settings.combo_vip_discount));

  const aventurinhaPrice = BRL(aventurinhaTotal);
  const vipPrice = BRL(vipTotal);

  container.innerHTML = `
    <div class="mt-12 grid gap-6 md:grid-cols-2">
      <!-- Combo Aventurinha -->
      <div class="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-8 text-white backdrop-blur shadow-xl">
        <div>
          <div class="text-xs font-semibold uppercase tracking-wider text-amber-400">Combo Especial · ${neighborhood}</div>
          <h3 class="mt-1 font-display text-2xl font-bold">Combo Aventurinha</h3>
          <div class="mt-3 text-xs font-semibold text-white/70">Calculado para ${neighborhood} · Porte ${porteLabel}</div>
          <div class="mt-3 flex items-baseline gap-2">
            <div class="font-display text-4xl font-extrabold text-white">${aventurinhaPrice}</div>
            <div class="text-sm text-white/80">/ por aventura</div>
          </div>
          <ul class="mt-6 space-y-3 text-sm text-white/90">
            <li class="flex items-start gap-2.5">
              <div class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-400 text-slate-900 shadow-sm mt-0.5"><i data-lucide="check" class="h-3 w-3 stroke-[3]"></i></div>
              <span>Busca com Táxi Dog (até ${taxiKm} km inclusos) partindo de ${neighborhood}</span>
            </li>
            <li class="flex items-start gap-2.5">
              <div class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-400 text-slate-900 shadow-sm mt-0.5"><i data-lucide="check" class="h-3 w-3 stroke-[3]"></i></div>
              <span>1h de passeio Dog Walker para porte ${porteLabel}</span>
            </li>
            <li class="flex items-start gap-2.5">
              <div class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-400 text-slate-900 shadow-sm mt-0.5"><i data-lucide="check" class="h-3 w-3 stroke-[3]"></i></div>
              <span>Parque a sua escolha (com limite de 5km de distância)</span>
            </li>
            <li class="flex items-start gap-2.5">
              <div class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-400 text-slate-900 shadow-sm mt-0.5"><i data-lucide="check" class="h-3 w-3 stroke-[3]"></i></div>
              <span>Devolução em casa com segurança</span>
            </li>
            <li class="flex items-start gap-2.5">
              <div class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-400 text-slate-900 shadow-sm mt-0.5"><i data-lucide="check" class="h-3 w-3 stroke-[3]"></i></div>
              <span>${Math.round(settings.combo_aventurinha_discount * 100)}% de desconto sobre o valor cheio (${BRL(comboSum)})</span>
            </li>
          </ul>
          <div class="mt-4 text-xs text-white/50 italic">* Para um parque acima de 5km será necessário consulta</div>
        </div>
        <a href="${waLink(`Olá! Tenho interesse no *Combo Aventurinha* (${aventurinhaPrice}) para ${city} - ${neighborhood} (Porte ${porteLabel}).`)}" target="_blank" class="mt-6 inline-block w-full">
          <button class="w-full py-3.5 rounded-xl bg-amber-400 font-bold text-slate-900 hover:bg-amber-500 transition shadow-md">Quero este plano</button>
        </a>
      </div>

      <!-- Combo VIP Mensal -->
      <div class="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-amber-400 p-8 text-slate-900 shadow-xl">
        <span class="absolute right-4 top-4 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 shadow">Mais escolhido</span>
        <div>
          <div class="text-xs font-semibold uppercase tracking-wider text-slate-800">Assinatura · ${neighborhood}</div>
          <h3 class="mt-1 font-display text-2xl font-bold text-slate-900">Combo VIP Mensal</h3>
          <div class="mt-3 text-xs font-semibold text-slate-800">Calculado para ${neighborhood} · Porte ${porteLabel}</div>
          <div class="mt-3 flex items-baseline gap-2">
            <div class="font-display text-4xl font-extrabold text-slate-900">${vipPrice}</div>
            <div class="text-sm text-slate-800">/ por mês</div>
          </div>
          <ul class="mt-6 space-y-3 text-sm text-slate-900 font-medium">
            <li class="flex items-start gap-2.5">
              <div class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-900 text-amber-400 shadow-sm mt-0.5"><i data-lucide="check" class="h-3 w-3 stroke-[3]"></i></div>
              <span>Todos os benefícios do Combo Aventurinha</span>
            </li>
            <li class="flex items-start gap-2.5">
              <div class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-900 text-amber-400 shadow-sm mt-0.5"><i data-lucide="check" class="h-3 w-3 stroke-[3]"></i></div>
              <span>4 aventurinha mensais</span>
            </li>
            <li class="flex items-start gap-2.5">
              <div class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-900 text-amber-400 shadow-sm mt-0.5"><i data-lucide="check" class="h-3 w-3 stroke-[3]"></i></div>
              <span>${Math.round(settings.combo_vip_discount * 100)}% de desconto mensal (${BRL(round2(comboSum * 4))} sem desconto)</span>
            </li>
          </ul>
          <div class="mt-4 text-xs text-slate-800/70 italic">* Para um parque acima de 5km será necessário consulta</div>
        </div>
        <a href="${waLink(`Olá! Tenho interesse no *Combo VIP Mensal* (${vipPrice}) para ${city} - ${neighborhood} (Porte ${porteLabel}).`)}" target="_blank" class="mt-6 inline-block w-full">
          <button class="w-full py-3.5 rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800 transition shadow-md">Quero este plano</button>
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
document.addEventListener("DOMContentLoaded", () => {
  setupAccordion();
  initCityCombos();
  updateMonthlyTaxi();
  updateMonthlyWalker();
  refreshIcons();
});
