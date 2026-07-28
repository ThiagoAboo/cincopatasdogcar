import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  PawPrint,
  Car,
  Route as RouteIcon,
  ShieldCheck,
  DollarSign,
  MapPin,
  Clock,
  MessageCircle,
  Phone,
  CheckCircle2,
  Sparkles,
  CloudRain,
  XCircle,
  Wind,
  Menu,
  Quote,
  Timer,
  Loader2,
  Repeat,
  Printer,
  Syringe,
  Users,
  Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import thiago1 from "@/assets/thiago-1.jpg.asset.json";
import thiago2 from "@/assets/thiago-2.jpg.asset.json";
import thiago3 from "@/assets/thiago-3.jpg.asset.json";
import thiago4 from "@/assets/thiago-4.jpg.asset.json";
import car1 from "@/assets/car-1.jpg.asset.json";
import car2 from "@/assets/car-2.jpg.asset.json";
import { settingsQueryOptions, type AppSettings, type PorteId } from "@/lib/settings";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQueryOptions),
  component: Index,
});

const BRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const round2 = (n: number) => Math.round(n * 100) / 100;

const waLink = (number: string, msg: string) =>
  `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;

// --- Geocoding & distance --------------------------------------------------
type LatLon = { lat: number; lon: number };
type Suggestion = { label: string; lat: number; lon: number };

async function searchAddresses(q: string): Promise<Suggestion[]> {
  const query = q.trim();
  if (query.length < 4) return [];
  const bias = /rj|rio de janeiro|brasil/i.test(query) ? query : `${query}, Rio de Janeiro, Brasil`;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=br&addressdetails=1&q=${encodeURIComponent(bias)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const data: Array<{ display_name: string; lat: string; lon: string }> = await res.json();
    return data.map((d) => ({
      label: d.display_name,
      lat: parseFloat(d.lat),
      lon: parseFloat(d.lon),
    }));
  } catch {
    return [];
  }
}

async function geocodeAddress(address: string): Promise<LatLon | null> {
  const list = await searchAddresses(address);
  return list.length ? { lat: list[0].lat, lon: list[0].lon } : null;
}

function haversineKm(a: LatLon, b: LatLon): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 =
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(s1 + s2), Math.sqrt(1 - (s1 + s2)));
  // Aproximação de trajeto rodoviário: haversine * 1.25
  return Math.round(R * c * 1.25 * 10) / 10;
}

function validateAddress(v: string): string | null {
  const s = v.trim();
  if (s.length < 8) return "Endereço muito curto — informe rua e bairro.";
  if (!/[A-Za-zÀ-ÿ]{3,}/.test(s))
    return "Informe o nome da rua com pelo menos 3 letras.";
  const hasNumber = /\d{1,5}/.test(s);
  const hasComma = /,/.test(s);
  if (!hasNumber && !hasComma)
    return "Inclua o número do imóvel ou o bairro (separado por vírgula).";
  return null;
}

// --- Address input with suggestions ---------------------------------------
function AddressInput({
  id,
  value,
  onChange,
  invalid,
  placeholder,
  className,
  listId,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  placeholder?: string;
  className?: string;
  listId: string;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    if (value.trim().length < 4) {
      setSuggestions([]);
      return;
    }
    debRef.current = setTimeout(async () => {
      const list = await searchAddresses(value);
      setSuggestions(list);
    }, 500);
    return () => {
      if (debRef.current) clearTimeout(debRef.current);
    };
  }, [value]);

  return (
    <>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        placeholder={placeholder}
        list={listId}
        autoComplete="off"
        className={className}
      />
      <datalist id={listId}>
        {suggestions.map((s, i) => (
          <option key={i} value={s.label} />
        ))}
      </datalist>
    </>
  );
}

// --- Types & shared state --------------------------------------------------
type TaxiResult = {
  porte: PorteId;
  porteLabel: string;
  distToPickup: number;
  distTrip: number;
  fuelCost: number;
  tripCost: number;
  withHuman: boolean;
  tripType: "ida" | "ida_volta";
  total: number;
  pickup: string;
  destination: string;
};

type WalkerResult = {
  porte: PorteId;
  porteLabel: string;
  minutes: number;
  local: string;
  hourly: number;
  travelFee: number;
  total: number;
};

// --- Táxi Dog Calculator ---------------------------------------------------
function TaxiCalculator({
  settings,
  onResult,
}: {
  settings: AppSettings;
  onResult: (r: TaxiResult | null) => void;
}) {
  const [porte, setPorte] = useState<PorteId>("medio");
  const [tripType, setTripType] = useState<"ida" | "ida_volta">("ida");
  const [withHuman, setWithHuman] = useState(false);
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [errors, setErrors] = useState<{ pickup?: string; destination?: string; geo?: string }>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TaxiResult | null>(null);

  const calc = useCallback(async () => {
    const pickupErr = validateAddress(pickup);
    const destErr = validateAddress(destination);
    if (pickupErr || destErr) {
      setErrors({ pickup: pickupErr ?? undefined, destination: destErr ?? undefined });
      setResult(null);
      onResult(null);
      return;
    }
    setErrors({});
    setLoading(true);
    const [pCoord, dCoord] = await Promise.all([
      geocodeAddress(pickup),
      geocodeAddress(destination),
    ]);
    setLoading(false);
    if (!pCoord || !dCoord) {
      setErrors({ geo: "Não conseguimos localizar um dos endereços. Verifique e tente novamente com rua, número e bairro." });
      setResult(null);
      onResult(null);
      return;
    }
    const distToPickup = haversineKm(settings.base_coords, pCoord);
    const distTripOneWay = haversineKm(pCoord, dCoord);
    const perKm = withHuman ? settings.taxi_per_km_human : settings.taxi_per_km_pet;
    const distTrip = tripType === "ida_volta" ? distTripOneWay * 2 : distTripOneWay;
    const fuelCost = round2(distToPickup * settings.fuel_cost_per_km);
    const rawTripCost = round2(distTrip * perKm);
    // Preço mínimo do táxi = min_price + combustível
    const rawTotal = round2(fuelCost + rawTripCost);
    const minTotal = round2(settings.taxi_min_price + fuelCost);
    const total = Math.max(rawTotal, minTotal);
    const tripCost = round2(total - fuelCost);
    const pd = settings.porte_options.find((p) => p.id === porte)!;
    const r: TaxiResult = {
      porte,
      porteLabel: pd.label,
      distToPickup,
      distTrip: Math.round(distTrip * 10) / 10,
      fuelCost,
      tripCost,
      withHuman,
      tripType,
      total,
      pickup,
      destination,
    };
    setResult(r);
    onResult(r);
  }, [porte, tripType, withHuman, pickup, destination, onResult, settings]);

  const wa = useMemo(() => {
    if (!result) return "#";
    const tipo = result.tripType === "ida_volta" ? "Ida e Volta" : "Somente Ida";
    return waLink(
      settings.whatsapp_number,
      `Olá! Gostaria de agendar um *Táxi Dog* pela ${settings.brand}.\n\n` +
        `🐶 Porte: ${result.porteLabel}\n` +
        `🔁 Modalidade: ${tipo}\n` +
        `👤 Humano junto: ${result.withHuman ? "Sim" : "Não"}\n` +
        `📍 Partida: ${result.pickup}\n` +
        `🎯 Destino: ${result.destination}\n` +
        `📏 Distância trajeto: ${result.distTrip} km\n` +
        `💰 Valor estimado: ${BRL(result.total)}\n\n` +
        `Podemos confirmar o horário?`,
    );
  }, [result, settings.brand, settings.whatsapp_number]);

  return (
    <Card className="relative overflow-hidden border-0 p-0 shadow-elegant">
      <div className="grid gap-0 md:grid-cols-2">
        <div className="bg-navy p-5 text-white sm:p-8 md:p-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            Calculadora Inteligente
          </div>
          <h3 className="font-display text-2xl font-bold sm:text-3xl">
            Simule sua corrida de Táxi Dog
          </h3>
          <p className="mt-2 text-sm text-white/70">
            Cálculo transparente com deslocamento até você e trajeto do pet.
          </p>

          <div className="mt-8 space-y-5">
            <div>
              <Label className="mb-2 flex items-center gap-2 text-white/90">
                <PawPrint className="h-4 w-4 text-gold" /> Porte do Pet
              </Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {settings.porte_options.map((p) => {
                  const active = porte === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPorte(p.id)}
                      aria-pressed={active}
                      className={
                        "rounded-xl border px-2 py-2.5 text-left transition " +
                        (active
                          ? "border-gold bg-gold/15 text-white shadow-gold"
                          : "border-white/15 bg-white/5 text-white/80 hover:border-white/30")
                      }
                    >
                      <div className="text-sm font-semibold">{p.label}</div>
                      <div className="text-[10px] text-white/60">{p.weight}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="mb-2 flex items-center gap-2 text-white/90">
                <Repeat className="h-4 w-4 text-gold" /> Modalidade
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {(["ida", "ida_volta"] as const).map((t) => {
                  const active = tripType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTripType(t)}
                      aria-pressed={active}
                      className={
                        "rounded-xl border px-3 py-2.5 text-sm font-semibold transition " +
                        (active
                          ? "border-gold bg-gold/15 text-white shadow-gold"
                          : "border-white/15 bg-white/5 text-white/80 hover:border-white/30")
                      }
                    >
                      {t === "ida" ? "Somente Ida" : "Ida e Volta"}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="mb-2 flex items-center gap-2 text-white/90">
                <Users className="h-4 w-4 text-gold" /> O humano vai junto?
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: false, label: "Só o Pet" },
                  { v: true, label: "Pet + Humano" },
                ].map((o) => {
                  const active = withHuman === o.v;
                  return (
                    <button
                      key={String(o.v)}
                      type="button"
                      onClick={() => setWithHuman(o.v)}
                      aria-pressed={active}
                      className={
                        "rounded-xl border px-3 py-2.5 text-sm font-semibold transition " +
                        (active
                          ? "border-gold bg-gold/15 text-white shadow-gold"
                          : "border-white/15 bg-white/5 text-white/80 hover:border-white/30")
                      }
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="pickup" className="mb-2 flex items-center gap-2 text-white/90">
                <MapPin className="h-4 w-4 text-gold" /> Endereço de Partida do Pet
              </Label>
              <AddressInput
                id="pickup"
                listId="pickup-list"
                value={pickup}
                onChange={(v) => {
                  setPickup(v);
                  if (errors.pickup) setErrors((s) => ({ ...s, pickup: undefined }));
                }}
                invalid={!!errors.pickup}
                placeholder="Ex: Rua Coronel Moreira César, 123, Icaraí, Niterói"
                className={
                  "border-white/20 bg-white/10 text-white placeholder:text-white/50 focus-visible:ring-gold " +
                  (errors.pickup ? "border-red-400/70 focus-visible:ring-red-400" : "")
                }
              />
              {errors.pickup && (
                <p className="mt-1.5 text-xs text-red-300">{errors.pickup}</p>
              )}
            </div>
            <div>
              <Label htmlFor="destination" className="mb-2 flex items-center gap-2 text-white/90">
                <RouteIcon className="h-4 w-4 text-gold" /> Endereço de Destino do Pet
              </Label>
              <AddressInput
                id="destination"
                listId="destination-list"
                value={destination}
                onChange={(v) => {
                  setDestination(v);
                  if (errors.destination) setErrors((s) => ({ ...s, destination: undefined }));
                }}
                invalid={!!errors.destination}
                placeholder="Ex: Av. Presidente Kennedy, 500, Centro, São Gonçalo"
                className={
                  "border-white/20 bg-white/10 text-white placeholder:text-white/50 focus-visible:ring-gold " +
                  (errors.destination ? "border-red-400/70 focus-visible:ring-red-400" : "")
                }
              />
              {errors.destination && (
                <p className="mt-1.5 text-xs text-red-300">{errors.destination}</p>
              )}
            </div>

            {errors.geo && (
              <p className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-xs text-red-200">
                {errors.geo}
              </p>
            )}

            <Button
              onClick={calc}
              size="lg"
              disabled={loading}
              className="w-full bg-gold-gradient font-semibold text-navy shadow-gold hover:opacity-95"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculando...
                </>
              ) : (
                "Calcular Valor Estimado"
              )}
            </Button>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-8 md:p-10">
          {!result ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary">
                <DollarSign className="h-8 w-8 text-navy" />
              </div>
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                Preencha os endereços e clique em{" "}
                <span className="font-semibold text-navy">Calcular</span> para ver o orçamento
                detalhado da corrida.
              </p>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Orçamento detalhado
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-navy text-white hover:bg-navy">
                    <PawPrint className="mr-1 h-3 w-3 text-gold" /> Porte {result.porteLabel}
                  </Badge>
                  <Badge className="bg-gold text-navy hover:bg-gold">
                    <Repeat className="mr-1 h-3 w-3" />
                    {result.tripType === "ida_volta" ? "Ida e Volta" : "Somente Ida"}
                  </Badge>
                  {result.withHuman && (
                    <Badge className="bg-navy text-white hover:bg-navy">
                      <Users className="mr-1 h-3 w-3 text-gold" /> + Humano
                    </Badge>
                  )}
                </div>
              </div>

              <ul className="space-y-3 text-sm">
                <li className="flex items-start justify-between gap-4 border-b border-border/60 pb-3">
                  <span className="text-muted-foreground">
                    Combustível até você
                    <span className="mt-0.5 block text-xs text-muted-foreground/70">
                      Base ➔ Cliente · {result.distToPickup} km
                    </span>
                  </span>
                  <span className="font-semibold text-navy">{BRL(result.fuelCost)}</span>
                </li>
                <li className="flex items-start justify-between gap-4 border-b border-border/60 pb-3">
                  <span className="text-muted-foreground">
                    Trajeto {result.withHuman ? "Pet + Humano" : "do Pet"}
                    <span className="mt-0.5 block text-xs text-muted-foreground/70">
                      {result.tripType === "ida_volta" ? "Ida + Volta" : "Cliente ➔ Destino"} ·{" "}
                      {result.distTrip} km
                    </span>
                  </span>
                  <span className="font-semibold text-navy">{BRL(result.tripCost)}</span>
                </li>
              </ul>

              <div className="mt-5 rounded-2xl bg-navy p-4 text-white sm:p-5">
                <div className="text-xs uppercase tracking-wider text-white/60">
                  Valor Total Estimado
                </div>
                <div className="mt-1 font-display text-3xl font-extrabold text-gold sm:text-4xl md:text-5xl">
                  {BRL(result.total)}
                </div>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                <strong>Nota:</strong> Taxa de higienização <strong>não está inclusa</strong> — só
                será cobrada em caso de incidente higiênico (xixi, cocô ou vômito), de{" "}
                {BRL(settings.hygiene_fee_min)} a {BRL(settings.hygiene_fee_max)} conforme a
                limpeza necessária. Os primeiros{" "}
                <strong>{settings.wait_time_free_min} minutos de espera são grátis</strong>; após
                isso, {BRL(settings.wait_time_fee)} a cada {settings.wait_time_fee_min_block}{" "}
                minutos.
              </p>

              <a href={wa} target="_blank" rel="noreferrer" className="mt-5">
                <Button size="lg" className="w-full bg-whatsapp font-semibold text-white hover:opacity-95">
                  <MessageCircle className="mr-2 h-5 w-5" /> Confirmar e Agendar via WhatsApp
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// --- Walker Calculator -----------------------------------------------------
function WalkerCalculator({
  settings,
  onResult,
}: {
  settings: AppSettings;
  onResult: (r: WalkerResult | null) => void;
}) {
  const [porte, setPorte] = useState<PorteId>("medio");
  const [minutes, setMinutes] = useState(60);
  const [local, setLocal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WalkerResult | null>(null);

  const calc = useCallback(async () => {
    const err = validateAddress(local);
    if (err) {
      setError(err);
      setResult(null);
      onResult(null);
      return;
    }
    setError(null);
    setLoading(true);
    const coord = await geocodeAddress(local);
    setLoading(false);
    if (!coord) {
      setError("Não localizamos o endereço. Tente com rua, número e bairro.");
      setResult(null);
      onResult(null);
      return;
    }
    const dist = haversineKm(settings.base_coords, coord);
    const hourly = settings.walker_price_by_porte[porte];
    const time = settings.walk_time_options.find((t) => t.min === minutes)!;
    const walkPrice = hourly * time.factor;
    const travelFee =
      dist > settings.walker_travel_fee_km_threshold
        ? round2((dist - settings.walker_travel_fee_km_threshold) * settings.walker_travel_fee_per_km_over)
        : 0;
    const raw = round2(walkPrice + travelFee);
    // Preço mínimo: min + combustível (travelFee é o combustível até você)
    const minTotal = round2(settings.walker_min_price + travelFee);
    const total = Math.max(raw, minTotal);
    const pd = settings.porte_options.find((p) => p.id === porte)!;
    const r: WalkerResult = {
      porte,
      porteLabel: pd.label,
      minutes,
      local,
      hourly,
      travelFee,
      total,
    };
    setResult(r);
    onResult(r);
  }, [porte, minutes, local, onResult, settings]);

  const wa = useMemo(() => {
    if (!result) return "#";
    return waLink(
      settings.whatsapp_number,
      `Olá! Gostaria de agendar um *Passeio Dog Walker* pela ${settings.brand}.\n\n` +
        `🐶 Porte: ${result.porteLabel}\n` +
        `⏱️ Duração: ${result.minutes} min\n` +
        `📍 Local do encontro: ${result.local}\n` +
        `💰 Valor estimado: ${BRL(result.total)}\n\n` +
        `Podemos confirmar dia e horário?`,
    );
  }, [result, settings.brand, settings.whatsapp_number]);

  return (
    <Card className="relative overflow-hidden border-0 p-0 shadow-elegant">
      <div className="grid gap-0 md:grid-cols-2">
        <div className="bg-gold-gradient p-5 text-navy sm:p-8 md:p-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-navy/10 px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> Simulador de Passeio
          </div>
          <h3 className="font-display text-2xl font-bold sm:text-3xl">Simule o passeio</h3>
          <p className="mt-2 text-sm text-navy/70">
            Escolha porte, duração e local — o valor sai na hora.
          </p>

          <div className="mt-8 space-y-5">
            <div>
              <Label className="mb-2 flex items-center gap-2 text-navy">
                <PawPrint className="h-4 w-4" /> Porte do Pet
              </Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {settings.porte_options.map((p) => {
                  const active = porte === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPorte(p.id)}
                      className={
                        "rounded-xl border px-2 py-2.5 text-left transition " +
                        (active
                          ? "border-navy bg-navy text-white"
                          : "border-navy/20 bg-white/60 text-navy hover:border-navy/50")
                      }
                    >
                      <div className="text-sm font-semibold">{p.label}</div>
                      <div className="text-[10px] opacity-70">{p.weight}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="mb-2 flex items-center gap-2 text-navy">
                <Timer className="h-4 w-4" /> Duração
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {settings.walk_time_options.map((t) => {
                  const active = minutes === t.min;
                  return (
                    <button
                      key={t.min}
                      type="button"
                      onClick={() => setMinutes(t.min)}
                      className={
                        "rounded-xl border px-2 py-2.5 text-sm font-semibold transition " +
                        (active
                          ? "border-navy bg-navy text-white"
                          : "border-navy/20 bg-white/60 text-navy hover:border-navy/50")
                      }
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="walk-local" className="mb-2 flex items-center gap-2 text-navy">
                <MapPin className="h-4 w-4" /> Local do encontro
              </Label>
              <AddressInput
                id="walk-local"
                listId="walk-local-list"
                value={local}
                onChange={(v) => {
                  setLocal(v);
                  if (error) setError(null);
                }}
                invalid={!!error}
                placeholder="Ex: Rua Coronel Moreira César, 123, Icaraí, Niterói"
                className={
                  "border-navy/20 bg-white text-navy placeholder:text-navy/50 focus-visible:ring-navy " +
                  (error ? "border-red-500 focus-visible:ring-red-500" : "")
                }
              />
              {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
            </div>

            <Button
              onClick={calc}
              size="lg"
              disabled={loading}
              className="w-full bg-navy font-semibold text-white hover:bg-navy-deep"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculando...
                </>
              ) : (
                "Simular Passeio"
              )}
            </Button>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-8 md:p-10">
          {!result ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-warm">
                <PawPrint className="h-8 w-8 text-navy" />
              </div>
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                Escolha porte, duração e local para ver o valor do passeio.
              </p>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Orçamento do passeio
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-navy text-white hover:bg-navy">
                    <PawPrint className="mr-1 h-3 w-3 text-gold" /> Porte {result.porteLabel}
                  </Badge>
                  <Badge className="bg-gold text-navy hover:bg-gold">
                    <Timer className="mr-1 h-3 w-3" /> {result.minutes} min
                  </Badge>
                </div>
              </div>

              <ul className="space-y-3 text-sm">
                <li className="flex items-start justify-between gap-4 border-b border-border/60 pb-3">
                  <span className="text-muted-foreground">
                    Valor do passeio
                    <span className="mt-0.5 block text-xs text-muted-foreground/70">
                      Base: {BRL(result.hourly)}/h
                    </span>
                  </span>
                  <span className="font-semibold text-navy">
                    {BRL(round2(result.total - result.travelFee))}
                  </span>
                </li>
                {result.travelFee > 0 && (
                  <li className="flex items-start justify-between gap-4 border-b border-border/60 pb-3">
                    <span className="text-muted-foreground">Combustível até você</span>
                    <span className="font-semibold text-navy">{BRL(result.travelFee)}</span>
                  </li>
                )}
              </ul>

              <div className="mt-5 rounded-2xl bg-navy p-4 text-white sm:p-5">
                <div className="text-xs uppercase tracking-wider text-white/60">Valor Total</div>
                <div className="mt-1 font-display text-3xl font-extrabold text-gold sm:text-4xl md:text-5xl">
                  {BRL(result.total)}
                </div>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                <strong>Nota:</strong> Taxa de higienização <strong>não está inclusa</strong>. Só
                será cobrada se houver incidente higiênico durante o passeio.
              </p>

              <a href={wa} target="_blank" rel="noreferrer" className="mt-5">
                <Button size="lg" className="w-full bg-whatsapp font-semibold text-white hover:opacity-95">
                  <MessageCircle className="mr-2 h-5 w-5" /> Agendar Passeio no WhatsApp
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// --- Page ------------------------------------------------------------------
const walkerPerksCommon = [
  "Passeio ativo de 1h",
  "Ritmo e manejo adaptados ao porte",
  "Água fresca sempre disponível",
  "Atenção individual ao seu pet",
];

function Index() {
  const { data: settings } = useSuspenseQuery(settingsQueryOptions);
  const [taxi, setTaxi] = useState<TaxiResult | null>(null);
  const [walker, setWalker] = useState<WalkerResult | null>(null);

  const wa = (msg: string) => waLink(settings.whatsapp_number, msg);

  const walkerTiers = useMemo(
    () =>
      settings.porte_options.map((p) => ({
        id: p.id,
        label: `Porte ${p.label}`,
        weight: p.weight,
        price: BRL(settings.walker_price_by_porte[p.id]),
        perks: walkerPerksCommon,
      })),
    [settings],
  );

  // Combos — sempre consideram taxi + passeio (usam mínimos quando não simulado)
  const taxiEstimate = taxi?.total ?? settings.taxi_min_price;
  const walkerEstimate = walker?.total ?? settings.walker_min_price;
  const bothSimulated = !!taxi && !!walker;

  const aventurinha = useMemo(() => {
    const total = round2((taxiEstimate + walkerEstimate) * (1 - settings.combo_aventurinha_discount));
    return {
      price: BRL(total),
      prefix: bothSimulated ? "Personalizado" : "A partir de",
    };
  }, [taxiEstimate, walkerEstimate, bothSimulated, settings.combo_aventurinha_discount]);

  const vipMensal = useMemo(() => {
    const total = round2(
      (taxiEstimate + walkerEstimate) * 4 * (1 - settings.combo_vip_discount),
    );
    return {
      price: BRL(total),
      prefix: bothSimulated ? "Personalizado" : "A partir de",
    };
  }, [taxiEstimate, walkerEstimate, bothSimulated, settings.combo_vip_discount]);

  const combos = [
    {
      title: "Combo Aventurinha",
      subtitle: "Combo especial",
      price: aventurinha.price,
      prefix: aventurinha.prefix,
      period: "por aventura",
      highlight: false,
      items: [
        "Busca com o Táxi Dog",
        "1h de passeio no parque ou destino escolhido",
        "Devolução em casa com segurança",
        `${Math.round(settings.combo_aventurinha_discount * 100)}% de desconto sobre o valor cheio`,
      ],
      wa: wa(
        `Olá! Tenho interesse no *Combo Aventurinha* (${aventurinha.price} — ${aventurinha.prefix}).\n\nPodemos combinar os detalhes?`,
      ),
    },
    {
      title: "Combo VIP Mensal",
      subtitle: "Assinatura",
      price: vipMensal.price,
      prefix: vipMensal.prefix,
      period: "por mês",
      highlight: true,
      items: [
        "1 aventura semanal (táxi + passeio)",
        "Transporte incluso",
        "Prioridade na agenda",
        `${Math.round(settings.combo_vip_discount * 100)}% de desconto sobre o valor cheio`,
      ],
      wa: wa(
        `Olá! Tenho interesse no *Combo VIP Mensal* (${vipMensal.price} — ${vipMensal.prefix}).\n\nPodemos combinar os detalhes?`,
      ),
    },
  ];

  const monthlyWalker = useMemo(() => {
    return settings.monthly_tiers.map((t) => {
      const unit = walker?.total ?? settings.walker_min_price;
      const total = round2(unit * t.freq * 4 * (1 - settings.monthly_pkg_discount));
      return {
        ...t,
        price: BRL(total),
        prefix: (walker ? "Personalizado" : "A partir de") as const,
      };
    });
  }, [walker, settings]);

  const monthlyTaxi = useMemo(() => {
    return settings.monthly_tiers.map((t) => {
      const unit = taxi?.total ?? settings.taxi_min_price;
      const total = round2(unit * t.freq * 4 * (1 - settings.monthly_pkg_discount));
      return {
        ...t,
        price: BRL(total),
        prefix: (taxi ? "Personalizado" : "A partir de") as const,
      };
    });
  }, [taxi, settings]);

  return (
    <div className="min-h-screen bg-background">
      {/* NAV */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-2 text-white">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gold-gradient">
              <PawPrint className="h-5 w-5 text-navy" />
            </div>
            <span className="font-display text-lg font-bold">{settings.brand_short}</span>
          </a>
          <nav className="hidden items-center gap-8 text-sm font-medium text-white/80 md:flex">
            <a href="#calculadora" className="hover:text-gold">Táxi Dog</a>
            <a href="#simulador-passeio" className="hover:text-gold">Passeios</a>
            <a href="#planos" className="hover:text-gold">Planos</a>
            <a href="#sobre" className="hover:text-gold">Sobre</a>
            <a href="#faq" className="hover:text-gold">FAQ</a>
          </nav>
          <a
            href={wa(`Olá! Vim pelo site da ${settings.brand} e gostaria de mais informações.`)}
            target="_blank"
            rel="noreferrer"
            className="hidden md:block"
          >
            <Button className="bg-gold-gradient font-semibold text-navy hover:opacity-95">
              Falar no WhatsApp
            </Button>
          </a>
          <button className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-white md:hidden" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative overflow-hidden bg-hero-gradient text-white">
        <img
          src={thiago4.url}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-hero-gradient/80" aria-hidden />
        <div className="absolute inset-0 opacity-[0.10]" aria-hidden>
          <div className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-gold blur-3xl" />
          <div className="absolute right-0 top-64 h-96 w-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-32 sm:px-6 sm:pb-32 sm:pt-40 lg:px-8 lg:pt-44">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium backdrop-blur">
                <ShieldCheck className="h-3.5 w-3.5 text-gold" />
                Base em {settings.city_base}
              </div>
              <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
                Cuidado de verdade para o seu pet: {" "}
                <span className="text-gold">transporte tranquilo</span> e passeios felizes
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                {settings.brand} — Táxi Dog e Dog Walker profissional focados no conforto e
                bem-estar do seu melhor amigo. Atendemos {settings.cities_covered.join(", ")}.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#calculadora">
                  <Button size="lg" className="bg-gold-gradient font-semibold text-navy shadow-gold hover:opacity-95">
                    <Car className="mr-2 h-5 w-5" /> Simular Táxi Dog
                  </Button>
                </a>
                <a href="#simulador-passeio">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 bg-white/5 font-semibold text-white hover:bg-white/10 hover:text-white"
                  >
                    Simular Passeio
                  </Button>
                </a>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gold/10 blur-2xl" aria-hidden />
              <Card className="relative overflow-hidden border-white/10 bg-white/[0.06] p-5 text-white shadow-elegant backdrop-blur">
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src={car1.url}
                    alt={`${settings.brand} - veículo`}
                    className="aspect-[4/3] w-full object-cover"
                    loading="eager"
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    { icon: Car, title: "Nissan Livina", sub: "Espaçosa, ar-condicionado" },
                    { icon: ShieldCheck, title: "Cinto Pet", sub: "Certificado, banco traseiro" },
                    { icon: RouteIcon, title: "GNV econômico", sub: "Preço justo, sem surpresas" },
                    { icon: PawPrint, title: "Cabine cuidada", sub: "Higienização entre corridas" },
                  ].map((f) => (
                    <div key={f.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-gold-gradient">
                        <f.icon className="h-4 w-4 text-navy" />
                      </div>
                      <div className="mt-2 text-sm font-semibold">{f.title}</div>
                      <div className="mt-0.5 text-[11px] text-white/60">{f.sub}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* TAXI CALCULATOR */}
      <section id="calculadora" className="bg-secondary/40 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="bg-gold text-navy hover:bg-gold">Táxi Dog</Badge>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-navy sm:text-4xl">
              Calculadora Inteligente de Táxi Dog
            </h2>
            <p className="mt-3 text-muted-foreground">
              Preço justo com base na economia real do veículo: Nissan Livina a GNV, partindo de
              Alcântara.
            </p>
          </div>
          <div className="mt-10">
            <TaxiCalculator settings={settings} onResult={setTaxi} />
          </div>

          {/* Regras Importantes */}
          <div className="mt-12">
            <div className="mb-6 text-center">
              <Badge className="bg-navy text-white hover:bg-navy">Boas práticas</Badge>
              <h3 className="mt-3 font-display text-2xl font-extrabold text-navy sm:text-3xl">
                Regras Importantes para o seu Táxi Dog
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Regras simples que garantem uma viagem tranquila para o seu pet e para todos os
                outros que usam o serviço.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {[
                {
                  icon: ShieldCheck,
                  title: "Segurança em primeiro lugar",
                  desc: "O pet só viaja em caixa de transporte higienizada (para gatos) ou com cinto de segurança próprio para cães no banco traseiro.",
                },
                {
                  icon: Syringe,
                  title: "Vacinação em dia",
                  desc: "É indispensável a carteira de vacinação atualizada para o transporte — proteção do seu pet e de todos os outros cães que usam o serviço.",
                },
              ].map((r) => (
                <Card
                  key={r.title}
                  className="flex items-start gap-4 border-l-4 border-l-gold bg-white p-5 shadow-elegant"
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-gradient">
                    <r.icon className="h-5 w-5 text-navy" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-display text-lg font-bold text-navy">{r.title}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {r.desc}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WALKER SIMULATOR */}
      <section id="simulador-passeio" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="bg-navy text-white hover:bg-navy">Dog Walker</Badge>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-navy sm:text-4xl">
              Simule o passeio do seu cãozinho
            </h2>
            <p className="mt-3 text-muted-foreground">
              Informe o local, o tempo desejado e o porte — o valor aparece na hora.
            </p>
          </div>
          <div className="mt-10">
            <WalkerCalculator settings={settings} onResult={setWalker} />
          </div>
        </div>
      </section>

      {/* DOG WALKER TIERS */}
      <section id="passeios" className="bg-secondary/40 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="bg-navy text-white hover:bg-navy">Tabela de Passeios</Badge>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-navy sm:text-4xl">
              Passeios de 1 hora por porte
            </h2>
            <p className="mt-3 text-muted-foreground">
              Todos os pets recebem o mesmo padrão de cuidado — o que muda é apenas o valor
              conforme o porte.
            </p>
          </div>

          <Tabs defaultValue="pequeno" className="mt-10">
            <TabsList className="mx-auto flex h-auto w-full max-w-2xl flex-wrap justify-center gap-1 rounded-2xl bg-white p-1 shadow-sm">
              {walkerTiers.map((t) => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-navy/70 data-[state=active]:bg-navy data-[state=active]:text-white"
                >
                  {t.label.replace("Porte ", "")}
                </TabsTrigger>
              ))}
            </TabsList>

            {walkerTiers.map((t) => (
              <TabsContent key={t.id} value={t.id} className="mt-8">
                <Card className="grid gap-8 border-0 p-8 shadow-elegant md:grid-cols-[1fr_1.2fr] md:p-10">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-navy">
                      <PawPrint className="h-3.5 w-3.5" /> {t.weight}
                    </div>
                    <h3 className="mt-4 font-display text-2xl font-bold text-navy">{t.label}</h3>
                    <div className="mt-4 font-display text-4xl font-extrabold text-navy">{t.price}</div>
                    <div className="mt-1 text-sm text-muted-foreground">por passeio · 1h</div>
                  </div>
                  <ul className="space-y-3 border-t border-border pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
                    {t.perks.map((p) => (
                      <li key={p} className="flex items-start gap-3 text-sm text-navy/90">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                        <span>{p}</span>
                      </li>
                    ))}
                    <li className="pt-2">
                      <a
                        href={wa(
                          `Olá! Quero agendar um passeio de 1h para meu pet de ${t.label} (${t.price}).`,
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button className="bg-navy font-semibold text-white hover:bg-navy-deep">
                          Agendar {t.label.toLowerCase()}
                        </Button>
                      </a>
                    </li>
                  </ul>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* COMBOS & MONTHLY */}
      <section id="planos" className="bg-navy py-20 text-white sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="bg-gold text-navy hover:bg-gold">Combos & Mensais</Badge>
            <h2 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">
              Planos que combinam com a rotina do seu pet
            </h2>
            <p className="mt-3 text-white/70">
              Use as calculadoras acima e veja os valores dos combos e mensais atualizarem
              automaticamente com base no perfil real do seu pet.
            </p>
          </div>

          {/* Combos */}
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {combos.map((c) => (
              <Card
                key={c.title}
                className={`relative overflow-hidden border-0 p-8 ${
                  c.highlight ? "bg-gold-gradient text-navy shadow-gold" : "bg-white/[0.06] text-white backdrop-blur"
                }`}
              >
                {c.highlight && (
                  <span className="absolute right-4 top-4 rounded-full bg-navy px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold">
                    Mais escolhido
                  </span>
                )}
                <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  {c.subtitle}
                </div>
                <h3 className="mt-1 font-display text-2xl font-bold">{c.title}</h3>
                <div className="mt-4">
                  <div className={`text-xs font-semibold uppercase tracking-wider ${c.highlight ? "text-navy/70" : "text-gold"}`}>
                    {c.prefix}
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <div className="font-display text-4xl font-extrabold">{c.price}</div>
                    <div className="text-sm opacity-80">/ {c.period}</div>
                  </div>
                </div>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {c.items.map((it) => (
                    <li key={it} className="flex items-start gap-2">
                      <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${c.highlight ? "text-navy" : "text-gold"}`} />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
                <a href={c.wa} target="_blank" rel="noreferrer" className="mt-6 inline-block w-full">
                  <Button
                    className={
                      c.highlight
                        ? "w-full bg-navy font-semibold text-white hover:bg-navy-deep"
                        : "w-full bg-gold-gradient font-semibold text-navy hover:opacity-95"
                    }
                  >
                    Quero este plano
                  </Button>
                </a>
              </Card>
            ))}
          </div>

          {/* Monthly — Passeio */}
          <div className="mt-14">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-gold">
                  Pacotes mensais recorrentes
                </div>
                <h3 className="mt-1 font-display text-2xl font-bold">Passeios (Dog Walker)</h3>
                <p className="mt-1 text-sm text-white/60">
                  {walker
                    ? `Valores calculados com base no seu último passeio simulado (${Math.round(settings.monthly_pkg_discount * 100)}% off).`
                    : "Valores base — use o simulador de passeio para personalizar."}
                </p>
              </div>
              <div className="rounded-full bg-gold px-4 py-1.5 text-xs font-bold text-navy shadow-gold">
                🎉 {Math.round(settings.second_pet_discount * 100)}% OFF no 2º cãozinho da mesma casa!
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {monthlyWalker.map((m) => (
                <Card
                  key={m.tier}
                  className={`border-0 p-6 ${
                    m.accent ? "bg-white text-navy shadow-elegant ring-2 ring-gold" : "bg-white/[0.06] text-white backdrop-blur"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`grid h-9 w-9 place-items-center rounded-lg ${m.accent ? "bg-gold-gradient text-navy" : "bg-white/10 text-gold"}`}>
                      <PawPrint className="h-5 w-5" />
                    </div>
                    <div className="font-display text-lg font-bold">{m.tier}</div>
                  </div>
                  <div className={`mt-1 text-xs ${m.accent ? "text-muted-foreground" : "text-white/60"}`}>
                    {m.label}
                  </div>
                  <div className={`mt-4 text-[10px] font-semibold uppercase tracking-wider ${m.accent ? "text-navy/60" : "text-gold"}`}>
                    {m.prefix}
                  </div>
                  <div className="font-display text-2xl font-extrabold">
                    {m.price}
                    <span className={`ml-1 text-xs font-medium ${m.accent ? "text-muted-foreground" : "text-white/60"}`}>
                      /mês
                    </span>
                  </div>
                  <a
                    href={wa(
                      `Olá! Quero o *Plano Mensal de Passeios ${m.tier}* (${m.label}) — ${m.price}/mês (${m.prefix}).`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 block"
                  >
                    <Button
                      size="sm"
                      className={
                        m.accent
                          ? "w-full bg-navy font-semibold text-white hover:bg-navy-deep"
                          : "w-full bg-gold-gradient font-semibold text-navy hover:opacity-95"
                      }
                    >
                      Assinar {m.tier}
                    </Button>
                  </a>
                </Card>
              ))}
            </div>
          </div>

          {/* Monthly — Taxi */}
          <div className="mt-14">
            <div className="mb-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-gold">
                Pacotes mensais recorrentes
              </div>
              <h3 className="mt-1 font-display text-2xl font-bold">Táxi Dog</h3>
              <p className="mt-1 text-sm text-white/60">
                {taxi
                  ? `Valores calculados com base na sua última corrida simulada (${Math.round(settings.monthly_pkg_discount * 100)}% off).`
                  : "Valores base — use a calculadora de Táxi Dog para personalizar."}
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {monthlyTaxi.map((m) => (
                <Card
                  key={m.tier}
                  className={`border-0 p-6 ${
                    m.accent ? "bg-white text-navy shadow-elegant ring-2 ring-gold" : "bg-white/[0.06] text-white backdrop-blur"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`grid h-9 w-9 place-items-center rounded-lg ${m.accent ? "bg-gold-gradient text-navy" : "bg-white/10 text-gold"}`}>
                      <Car className="h-5 w-5" />
                    </div>
                    <div className="font-display text-lg font-bold">{m.tier}</div>
                  </div>
                  <div className={`mt-1 text-xs ${m.accent ? "text-muted-foreground" : "text-white/60"}`}>
                    {m.label}
                  </div>
                  <div className={`mt-4 text-[10px] font-semibold uppercase tracking-wider ${m.accent ? "text-navy/60" : "text-gold"}`}>
                    {m.prefix}
                  </div>
                  <div className="font-display text-2xl font-extrabold">
                    {m.price}
                    <span className={`ml-1 text-xs font-medium ${m.accent ? "text-muted-foreground" : "text-white/60"}`}>
                      /mês
                    </span>
                  </div>
                  <a
                    href={wa(
                      `Olá! Quero o *Plano Mensal de Táxi Dog ${m.tier}* (${m.label}) — ${m.price}/mês (${m.prefix}).`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 block"
                  >
                    <Button
                      size="sm"
                      className={
                        m.accent
                          ? "w-full bg-navy font-semibold text-white hover:bg-navy-deep"
                          : "w-full bg-gold-gradient font-semibold text-navy hover:opacity-95"
                      }
                    >
                      Assinar {m.tier}
                    </Button>
                  </a>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SOBRE MIM */}
      <section id="sobre" className="bg-warm py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="bg-gold text-navy hover:bg-gold">Sobre Mim</Badge>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-navy sm:text-4xl">
              Quem vai cuidar do seu melhor amigo?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Muito prazer, eu sou o Thiago. Conheça a história que deu vida à{" "}
              {settings.brand_short}.
            </p>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative mx-auto w-full max-w-sm lg:mx-0">
              <div className="absolute -inset-3 rounded-[2rem] bg-gold/20 blur-2xl" aria-hidden />
              <div className="relative grid grid-cols-2 gap-2.5">
                {[
                  { src: thiago1.url, alt: "Thiago com sua cachorrinha" },
                  { src: thiago2.url, alt: "Baylie em campo aberto" },
                  { src: thiago3.url, alt: "Kyra deitada na grama" },
                  { src: thiago4.url, alt: "A turma observando o horizonte" },
                ].map((p) => (
                  <img
                    key={p.src}
                    src={p.src}
                    alt={p.alt}
                    className="aspect-square w-full rounded-xl object-cover shadow-elegant"
                    loading="lazy"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-5 text-base leading-relaxed text-navy/90">
              <p>
                Há mais de 5 anos, morei em uma chácara em Papucaia e vivi o que significa estar
                verdadeiramente cercado de amor canino. Com o tempo, fui "adotado" por vários cães
                de rua e vizinhos que escolheram o meu quintal como ponto de encontro favorito.
              </p>
              <p>
                Meus companheiros de sempre foram <strong>Baylie e Kyra</strong>, mas a família
                cresceu rápido. Cuidei de um grupo diverso e cheio de personalidade:{" "}
                <strong>Jessie</strong>, a Labrador cheia de energia;{" "}
                <strong>Pretinho e Jhulie</strong>, Pitbulls poderosos mas carinhosos; e{" "}
                <strong>Amora e BB</strong>, as pequenas Pinschers corajosas. Gerenciar essa
                mistura me ensinou liderança, paciência e leitura corporal canina na prática.
              </p>
              <p>
                Além do meu próprio bando, atuei como voluntário em um abrigo local de Papucaia,
                ajudando a cuidar de cerca de 15 animais resgatados por vez. Foi ali que aprendi
                sobre manejo, higiene, primeiros socorros e a importância de cada detalhe no
                cuidado com um pet.
              </p>
              <p>
                Hoje, morando em Alcântara e dirigindo uma Nissan Livina espaçosa e com
                ar-condicionado, coloco toda essa experiência prática, paciência e amor no serviço
                da <strong>{settings.brand}</strong>. Seu pet não vai apenas ganhar uma carona ou
                um passeio; estará sob os cuidados de alguém que dedicou anos da vida a entender
                e respeitar os animais.
              </p>

              <Card className="mt-8 border-l-4 border-l-gold bg-white p-6 shadow-elegant">
                <Quote className="h-8 w-8 text-gold" />
                <p className="mt-3 font-display text-lg font-semibold text-navy">
                  Mais que um serviço, um cuidado baseado em anos de convivência, respeito e amor
                  real pelos animais.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 md:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <Badge className="bg-secondary text-navy hover:bg-secondary">Garantias</Badge>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-navy sm:text-4xl">
              Transparência e carinho em cada trajeto
            </h2>
            <p className="mt-4 text-muted-foreground">
              Um serviço construído em cima de três pilares: cuidado com o pet, flexibilidade para
              o tutor e comunicação honesta.
            </p>
            <ul className="mt-6 space-y-4 text-sm">
              {[
                { icon: ShieldCheck, t: "Cinto pet certificado" },
                { icon: Wind, t: "Ar-condicionado sempre ligado" },
                { icon: Clock, t: `${settings.wait_time_free_min} min de espera grátis` },
              ].map((i) => (
                <li key={i.t} className="flex items-center gap-3 text-navy/90">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary">
                    <i.icon className="h-4 w-4 text-navy" />
                  </div>
                  <span className="font-medium">{i.t}</span>
                </li>
              ))}
            </ul>
          </div>

          <Accordion type="single" collapsible defaultValue="seg" className="w-full">
            <AccordionItem value="seg" className="rounded-2xl border border-border bg-card px-5">
              <AccordionTrigger className="text-left text-base font-semibold text-navy">
                <span className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-gold" /> Cuidado no Transporte
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                Todos os pets viajam protegidos por cinto de segurança pet certificado no banco
                traseiro ou em caixa de transporte higienizada (para gatos). Veículo Nissan Livina
                espaçoso com ar-condicionado sempre ligado.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="higiene" className="mt-3 rounded-2xl border border-border bg-card px-5">
              <AccordionTrigger className="text-left text-base font-semibold text-navy">
                <span className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-gold" /> Taxa de Higienização
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                A higienização padrão do veículo entre corridas já é responsabilidade nossa e não é
                cobrada. Uma taxa adicional (de {BRL(settings.hygiene_fee_min)} a{" "}
                {BRL(settings.hygiene_fee_max)}) só é cobrada se ocorrer incidente higiênico
                durante o trajeto ou passeio (xixi, cocô ou vômito), conforme a limpeza necessária.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="canc" className="mt-3 rounded-2xl border border-border bg-card px-5">
              <AccordionTrigger className="text-left text-base font-semibold text-navy">
                <span className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-gold" /> Política de Cancelamento
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                Cancelamentos de passeios ou táxi são totalmente gratuitos se realizados com até{" "}
                {settings.cancel_free_hours} horas de antecedência.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="chuva" className="mt-3 rounded-2xl border border-border bg-card px-5">
              <AccordionTrigger className="text-left text-base font-semibold text-navy">
                <span className="flex items-center gap-3">
                  <CloudRain className="h-5 w-5 text-gold" /> Dias de Chuva
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                Em caso de chuvas fortes, os passeios externos podem ser remarcados ou convertidos
                em sessões de enriquecimento ambiental e gasto de energia indoor na própria casa do
                cliente.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* BUSINESS CARD (printable) */}
      <section id="cartao" className="print-card-section bg-secondary/40 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center print-hide">
            <Badge className="bg-gold text-navy hover:bg-gold">Cartão de Visita</Badge>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-navy sm:text-4xl">
              Leve a {settings.brand_short} no bolso
            </h2>
            <p className="mt-3 text-muted-foreground">
              Cartão de visita virtual — imprima em formato padrão (85 × 55 mm) com o verso de{" "}
              <strong>fidelidade</strong>.
            </p>
            <div className="mt-6 flex justify-center">
              <Button
                size="lg"
                onClick={() => typeof window !== "undefined" && window.print()}
                className="bg-navy font-semibold text-white hover:bg-navy-deep"
              >
                <Printer className="mr-2 h-5 w-5" /> Imprimir Cartão
              </Button>
            </div>
          </div>

          <div className="mx-auto mt-10 flex max-w-4xl flex-col items-center gap-6 print-card-wrapper sm:flex-row sm:justify-center">
            {/* FRENTE — foto do carro */}
            <div className="business-card business-card-front relative flex flex-col justify-between overflow-hidden rounded-xl bg-navy p-4 text-white shadow-elegant">
              <div
                aria-hidden
                className="business-card-bg pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: `url(${car1.url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  opacity: 0.35,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-navy/90 via-navy/70 to-navy/90" aria-hidden />
              <div className="relative flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-gold-gradient">
                  <PawPrint className="h-5 w-5 text-navy" />
                </div>
                <div className="leading-tight">
                  <div className="font-display text-[13px] font-extrabold">
                    {settings.brand_short}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-gold">
                    Dog Car & Walker
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="font-display text-[11px] font-semibold text-gold">
                  Thiago · Táxi Dog & Dog Walker
                </div>
                <ul className="mt-1.5 space-y-1 text-[10px] leading-tight text-white/85">
                  <li className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-gold" /> {settings.phone_display}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <MessageCircle className="h-3 w-3 text-gold" /> WhatsApp
                  </li>
                  <li className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-gold" /> {settings.city_base}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Instagram className="h-3 w-3 text-gold" /> {settings.instagram_handle}
                  </li>
                </ul>
              </div>
            </div>

            {/* VERSO — Fidelidade sobre foto das 3 cachorras */}
            <div className="business-card business-card-back relative flex flex-col justify-between overflow-hidden rounded-xl border border-gold/40 bg-white p-4 text-navy shadow-elegant">
              <div
                aria-hidden
                className="business-card-bg pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: `url(${thiago4.url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  opacity: 0.28,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-white/70 to-white/85" aria-hidden />
              <div className="relative">
                <div className="font-display text-[12px] font-extrabold text-navy">
                  Programa Fidelidade
                </div>
                <p className="mt-0.5 text-[9px] leading-tight text-navy/70">
                  A cada corrida ou passeio, carimbe uma patinha. Complete 10 e ganhe{" "}
                  <strong>1 serviço grátis</strong>.
                </p>
              </div>
              <div className="relative grid grid-cols-5 gap-1.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="grid aspect-square place-items-center rounded-md border border-dashed border-gold/70 bg-white/70 text-gold/70"
                  >
                    <PawPrint className="h-3.5 w-3.5" />
                  </div>
                ))}
              </div>
              <div className="relative text-center text-[8px] uppercase tracking-wider text-navy/60">
                cincopatasdogcar.lovable.app
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="bg-gold-gradient py-14">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center sm:px-6 md:flex-row md:justify-between md:text-left lg:px-8">
          <div>
            <h3 className="font-display text-2xl font-extrabold text-navy sm:text-3xl">
              Pronto para agendar o próximo passeio?
            </h3>
            <p className="mt-1 text-navy/80">
              Resposta em minutos pelo WhatsApp — sem compromisso.
            </p>
          </div>
          <a
            href={wa(`Olá! Vim pelo site da ${settings.brand} e quero agendar um serviço para meu pet.`)}
            target="_blank"
            rel="noreferrer"
          >
            <Button size="lg" className="bg-navy font-semibold text-white hover:bg-navy-deep">
              <MessageCircle className="mr-2 h-5 w-5" /> Chamar no WhatsApp
            </Button>
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-navy-deep py-14 text-white/80">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <div className="flex items-center gap-2 text-white">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gold-gradient">
                <PawPrint className="h-5 w-5 text-navy" />
              </div>
              <span className="font-display text-lg font-bold">{settings.brand}</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Base Operacional em {settings.city_base}. Atendimento estendido para{" "}
              {settings.cities_covered.filter((c) => !settings.city_base.includes(c)).join(", ")}.
            </p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gold">Serviços</div>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="#calculadora" className="hover:text-gold">Táxi Dog</a></li>
              <li><a href="#simulador-passeio" className="hover:text-gold">Dog Walker</a></li>
              <li><a href="#planos" className="hover:text-gold">Planos mensais</a></li>
              <li><a href="#faq" className="hover:text-gold">Perguntas frequentes</a></li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gold">Contato</div>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gold" /> {settings.phone_display}
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gold" /> {settings.city_base}
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gold" /> {settings.schedule_display}
              </li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-6xl border-t border-white/10 px-4 pt-6 text-xs text-white/50 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} {settings.brand}. Todos os direitos reservados.
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <a
        href={wa(`Olá! Vim pelo site da ${settings.brand} e gostaria de mais informações.`)}
        target="_blank"
        rel="noreferrer"
        aria-label="Falar no WhatsApp"
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-whatsapp text-white shadow-elegant transition-transform hover:scale-105 print-hide"
      >
        <MessageCircle className="h-7 w-7" />
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-whatsapp/60" aria-hidden />
      </a>
    </div>
  );
}
