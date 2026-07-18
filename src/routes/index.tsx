import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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

export const Route = createFileRoute("/")({
  component: Index,
});

const WHATSAPP_NUMBER = "5521992244753";
const PHONE_DISPLAY = "(21) 99224-4753";

// --- Distance mock ---------------------------------------------------------
// Deterministic pseudo-distance so the preview always returns a realistic
// value even without a Maps API key. Keyword hints bias the result.
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function mockDistanceKm(from: string, to: string, min = 5, max = 35): number {
  const t = (from + "|" + to).toLowerCase();
  const near = ["alcântara", "alcantara", "são gonçalo", "sao goncalo", "sg"];
  const far = ["maricá", "marica", "itaboraí", "itaborai", "niterói", "niteroi"];
  let bias = 0;
  if (near.some((k) => t.includes(k))) bias -= 8;
  if (far.some((k) => t.includes(k))) bias += 10;
  const base = (hashString(t) % 1000) / 1000;
  const raw = min + base * (max - min) + bias;
  const clamped = Math.max(3, Math.min(45, raw));
  return Math.round(clamped * 10) / 10;
}

const BRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// --- Calculator ------------------------------------------------------------
function TaxiCalculator() {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [result, setResult] = useState<null | {
    distToPickup: number;
    distTrip: number;
    fuelCost: number;
    tripCost: number;
    base: number;
    total: number;
  }>(null);

  const calc = () => {
    if (!pickup.trim() || !destination.trim()) return;
    const distToPickup = mockDistanceKm("alcantara", pickup, 4, 22);
    const distTrip = mockDistanceKm(pickup, destination, 3, 28);
    const base = 25;
    const fuelCost = Math.round(distToPickup * 0.34 * 100) / 100;
    const tripCost = Math.round(distTrip * 3 * 100) / 100;
    const total = Math.round((base + fuelCost + tripCost) * 100) / 100;
    setResult({ distToPickup, distTrip, fuelCost, tripCost, base, total });
  };

  const waLink = useMemo(() => {
    if (!result) return "#";
    const msg = `Olá! Gostaria de agendar um Táxi Dog.%0A%0A📍 Partida: ${encodeURIComponent(
      pickup,
    )}%0A🎯 Destino: ${encodeURIComponent(
      destination,
    )}%0A💰 Valor estimado: ${encodeURIComponent(BRL(result.total))}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  }, [result, pickup, destination]);

  return (
    <Card className="relative overflow-hidden border-0 p-0 shadow-elegant">
      <div className="grid gap-0 md:grid-cols-2">
        {/* Inputs */}
        <div className="bg-navy p-8 text-white md:p-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            Calculadora Inteligente
          </div>
          <h3 className="font-display text-2xl font-bold sm:text-3xl">
            Simule sua corrida de Táxi Dog
          </h3>
          <p className="mt-2 text-sm text-white/70">
            Cálculo transparente com custo de combustível e trajeto do pet.
          </p>

          <div className="mt-8 space-y-5">
            <div>
              <Label htmlFor="pickup" className="mb-2 flex items-center gap-2 text-white/90">
                <MapPin className="h-4 w-4 text-gold" />
                Endereço de Partida do Pet
              </Label>
              <Input
                id="pickup"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Ex: Rua Coronel Moreira César, Icaraí"
                className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus-visible:ring-gold"
              />
            </div>
            <div>
              <Label
                htmlFor="destination"
                className="mb-2 flex items-center gap-2 text-white/90"
              >
                <RouteIcon className="h-4 w-4 text-gold" />
                Endereço de Destino do Pet
              </Label>
              <Input
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Ex: Clínica Veterinária, Centro de SG"
                className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus-visible:ring-gold"
              />
            </div>
            <Button
              onClick={calc}
              size="lg"
              className="w-full bg-gold-gradient font-semibold text-navy shadow-gold hover:opacity-95"
            >
              Calcular Valor Estimado
            </Button>
          </div>
        </div>

        {/* Result */}
        <div className="bg-white p-8 md:p-10">
          {!result ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary">
                <DollarSign className="h-8 w-8 text-navy" />
              </div>
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                Preencha os endereços e clique em <span className="font-semibold text-navy">Calcular</span>{" "}
                para ver o orçamento detalhado da corrida do seu pet.
              </p>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Orçamento detalhado
              </div>

              <ul className="space-y-3 text-sm">
                <li className="flex items-start justify-between gap-4 border-b border-border/60 pb-3">
                  <span className="text-muted-foreground">
                    Taxa de Saída / Higienização
                  </span>
                  <span className="font-semibold text-navy">{BRL(result.base)}</span>
                </li>
                <li className="flex items-start justify-between gap-4 border-b border-border/60 pb-3">
                  <span className="text-muted-foreground">
                    Combustível até você
                    <span className="mt-0.5 block text-xs text-muted-foreground/70">
                      Alcântara ➔ Cliente · {result.distToPickup} km
                    </span>
                  </span>
                  <span className="font-semibold text-navy">{BRL(result.fuelCost)}</span>
                </li>
                <li className="flex items-start justify-between gap-4 border-b border-border/60 pb-3">
                  <span className="text-muted-foreground">
                    Trajeto do seu Pet
                    <span className="mt-0.5 block text-xs text-muted-foreground/70">
                      Cliente ➔ Destino · {result.distTrip} km
                    </span>
                  </span>
                  <span className="font-semibold text-navy">{BRL(result.tripCost)}</span>
                </li>
              </ul>

              <div className="mt-5 rounded-2xl bg-navy p-5 text-white">
                <div className="text-xs uppercase tracking-wider text-white/60">
                  Valor Total Estimado
                </div>
                <div className="mt-1 font-display text-4xl font-extrabold text-gold sm:text-5xl">
                  {BRL(result.total)}
                </div>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                *Nota: Primeiros 20 minutos de espera na clínica/pet shop são
                grátis. Após isso, será cobrado R$ 15,00 a cada 30 minutos.
              </p>

              <a href={waLink} target="_blank" rel="noreferrer" className="mt-5">
                <Button
                  size="lg"
                  className="w-full bg-whatsapp font-semibold text-white hover:opacity-95"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Confirmar e Agendar via WhatsApp
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// --- Data ------------------------------------------------------------------
const walkerTiers = [
  {
    id: "pequeno",
    label: "Porte Pequeno",
    weight: "Até 10 kg",
    price: "R$ 32,50",
    perks: ["Passeio ativo de 1h", "Fotos durante o trajeto", "Água fresca sempre"],
  },
  {
    id: "medio",
    label: "Porte Médio",
    weight: "11 kg a 25 kg",
    price: "R$ 37,50",
    perks: ["Passeio ativo de 1h", "Rotas variadas", "Relatório pós-passeio"],
  },
  {
    id: "grande",
    label: "Porte Grande",
    weight: "26 kg a 45 kg",
    price: "R$ 45,00",
    perks: ["Passeio ativo de 1h", "Guia reforçada + peitoral", "Gasto de energia real"],
  },
  {
    id: "gigante",
    label: "Porte Gigante",
    weight: "Acima de 45 kg",
    price: "R$ 57,50",
    perks: ["Passeio ativo de 1h", "Manejo especializado", "Percurso planejado"],
  },
];

const combos = [
  {
    title: "Combo Aventurinha",
    price: "R$ 80,00",
    period: "por aventura",
    highlight: false,
    items: [
      "Busca com o Táxi Dog",
      "1h de passeio no Campo de São Bento ou parque local",
      "Devolução em casa com segurança",
    ],
  },
  {
    title: "Combo VIP Mensal",
    price: "R$ 280,00",
    period: "por mês",
    highlight: true,
    items: [
      "1 passeio semanal em destino especial",
      "Transporte incluso (ida e volta)",
      "Prioridade na agenda",
    ],
  },
];

const monthly = [
  {
    tier: "Bronze",
    freq: "2x na semana",
    price: "A partir de R$ 180,00",
    accent: false,
  },
  {
    tier: "Prata",
    freq: "3x na semana",
    price: "A partir de R$ 240,00",
    accent: false,
  },
  {
    tier: "Ouro",
    freq: "5x na semana · Seg a Sex",
    price: "A partir de R$ 360,00",
    accent: true,
  },
];

// --- Page ------------------------------------------------------------------
function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* NAV */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-2 text-white">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gold-gradient">
              <PawPrint className="h-5 w-5 text-navy" />
            </div>
            <span className="font-display text-lg font-bold">Táxi Dog Alcântara</span>
          </a>
          <nav className="hidden items-center gap-8 text-sm font-medium text-white/80 md:flex">
            <a href="#calculadora" className="hover:text-gold">Calculadora</a>
            <a href="#passeios" className="hover:text-gold">Passeios</a>
            <a href="#planos" className="hover:text-gold">Planos</a>
            <a href="#faq" className="hover:text-gold">FAQ</a>
          </nav>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
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
        <div className="absolute inset-0 opacity-[0.08]" aria-hidden>
          <div className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-gold blur-3xl" />
          <div className="absolute right-0 top-64 h-96 w-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-32 sm:px-6 sm:pb-32 sm:pt-40 lg:px-8 lg:pt-44">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium backdrop-blur">
                <ShieldCheck className="h-3.5 w-3.5 text-gold" />
                Base em Alcântara · São Gonçalo (RJ)
              </div>
              <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
                O Transporte Mais Seguro e os{" "}
                <span className="text-gold">Melhores Passeios</span> para o seu Pet
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                Serviço especializado de Táxi Dog e Dog Walker focado no conforto e
                na segurança do seu melhor amigo. Atendemos com precisão as regiões
                de São Gonçalo, Niterói, Maricá e Itaboraí.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#calculadora">
                  <Button size="lg" className="bg-gold-gradient font-semibold text-navy shadow-gold hover:opacity-95">
                    <Car className="mr-2 h-5 w-5" />
                    Simular Táxi Dog
                  </Button>
                </a>
                <a href="#planos">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 bg-white/5 font-semibold text-white hover:bg-white/10 hover:text-white"
                  >
                    Ver Planos de Passeio
                  </Button>
                </a>
              </div>

              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6 text-left">
                {[
                  { k: "500+", v: "Pets transportados" },
                  { k: "4 cidades", v: "Área de cobertura" },
                  { k: "100%", v: "Cinto pet certificado" },
                ].map((s) => (
                  <div key={s.v}>
                    <dt className="font-display text-2xl font-bold text-gold">{s.k}</dt>
                    <dd className="mt-1 text-xs text-white/60">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Feature card */}
            <div className="relative hidden lg:block">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gold/10 blur-2xl" aria-hidden />
              <Card className="relative overflow-hidden border-white/10 bg-white/[0.06] p-8 text-white shadow-elegant backdrop-blur">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Car, title: "Nissan Livina", sub: "Espaçoso, com ar-condicionado" },
                    { icon: ShieldCheck, title: "Cinto Pet", sub: "Certificado, banco traseiro" },
                    { icon: RouteIcon, title: "Rota otimizada", sub: "GNV econômico, preço justo" },
                    { icon: PawPrint, title: "Cabine limpa", sub: "Higienização a cada corrida" },
                  ].map((f) => (
                    <div
                      key={f.title}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold-gradient">
                        <f.icon className="h-5 w-5 text-navy" />
                      </div>
                      <div className="mt-3 font-semibold">{f.title}</div>
                      <div className="mt-0.5 text-xs text-white/60">{f.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl bg-navy-deep p-4 text-sm">
                  <div className="flex items-center gap-2 text-gold">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-semibold">Preço 100% transparente</span>
                  </div>
                  <p className="mt-1 text-xs text-white/70">
                    Cobramos o custo real do combustível no deslocamento até você.
                    Sem taxas escondidas.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CALCULATOR */}
      <section id="calculadora" className="bg-secondary/40 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="bg-gold text-navy hover:bg-gold">Táxi Dog</Badge>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-navy sm:text-4xl">
              Calculadora Inteligente de Táxi Dog
            </h2>
            <p className="mt-3 text-muted-foreground">
              Preço justo com base na economia real do veículo: Nissan Livina a GNV,
              partindo de Alcântara.
            </p>
          </div>
          <div className="mt-10">
            <TaxiCalculator />
          </div>
        </div>
      </section>

      {/* DOG WALKER */}
      <section id="passeios" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="bg-navy text-white hover:bg-navy">Dog Walker</Badge>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-navy sm:text-4xl">
              Passeios de 1 hora por porte do cãozinho
            </h2>
            <p className="mt-3 text-muted-foreground">
              Ritmo, rota e manejo pensados para o tamanho e a energia do seu pet.
            </p>
          </div>

          <Tabs defaultValue="pequeno" className="mt-10">
            <TabsList className="mx-auto flex h-auto w-full max-w-2xl flex-wrap justify-center gap-1 rounded-2xl bg-secondary p-1">
              {walkerTiers.map((t) => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-navy/70 data-[state=active]:bg-navy data-[state=active]:text-white"
                >
                  {t.label}
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
                    <h3 className="mt-4 font-display text-2xl font-bold text-navy">
                      {t.label}
                    </h3>
                    <div className="mt-4 font-display text-4xl font-extrabold text-navy">
                      {t.price}
                    </div>
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
                      <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
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
              Assinaturas mensais e combos especiais que economizam de verdade.
            </p>
          </div>

          {/* Combos */}
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {combos.map((c) => (
              <Card
                key={c.title}
                className={`relative overflow-hidden border-0 p-8 ${
                  c.highlight
                    ? "bg-gold-gradient text-navy shadow-gold"
                    : "bg-white/[0.06] text-white backdrop-blur"
                }`}
              >
                {c.highlight && (
                  <span className="absolute right-4 top-4 rounded-full bg-navy px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold">
                    Mais escolhido
                  </span>
                )}
                <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  {c.title.includes("VIP") ? "Assinatura" : "Combo especial"}
                </div>
                <h3 className="mt-1 font-display text-2xl font-bold">{c.title}</h3>
                <div className="mt-4 flex items-baseline gap-2">
                  <div className="font-display text-4xl font-extrabold">{c.price}</div>
                  <div className="text-sm opacity-80">/ {c.period}</div>
                </div>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {c.items.map((it) => (
                    <li key={it} className="flex items-start gap-2">
                      <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${c.highlight ? "text-navy" : "text-gold"}`} />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-block w-full"
                >
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

          {/* Monthly packages */}
          <div className="mt-10">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <h3 className="font-display text-xl font-bold">Pacotes mensais recorrentes</h3>
              <div className="rounded-full bg-gold px-4 py-1.5 text-xs font-bold text-navy shadow-gold">
                🎉 50% OFF no 2º cãozinho da mesma casa!
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {monthly.map((m) => (
                <Card
                  key={m.tier}
                  className={`border-0 p-6 ${
                    m.accent
                      ? "bg-white text-navy shadow-elegant ring-2 ring-gold"
                      : "bg-white/[0.06] text-white backdrop-blur"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`grid h-9 w-9 place-items-center rounded-lg ${
                        m.accent ? "bg-gold-gradient text-navy" : "bg-white/10 text-gold"
                      }`}
                    >
                      <PawPrint className="h-5 w-5" />
                    </div>
                    <div className="font-display text-lg font-bold">{m.tier}</div>
                  </div>
                  <div className={`mt-1 text-xs ${m.accent ? "text-muted-foreground" : "text-white/60"}`}>
                    {m.freq}
                  </div>
                  <div className="mt-4 font-display text-2xl font-extrabold">
                    {m.price}
                    <span className={`ml-1 text-xs font-medium ${m.accent ? "text-muted-foreground" : "text-white/60"}`}>
                      /mês
                    </span>
                  </div>
                </Card>
              ))}
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
              Segurança, transparência e carinho em cada trajeto
            </h2>
            <p className="mt-4 text-muted-foreground">
              Um serviço construído em cima de três pilares: proteção do pet,
              flexibilidade para o tutor e comunicação honesta.
            </p>
            <ul className="mt-6 space-y-4 text-sm">
              {[
                { icon: ShieldCheck, t: "Cinto pet certificado" },
                { icon: Wind, t: "Ar-condicionado sempre ligado" },
                { icon: Clock, t: "20 min de espera grátis" },
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
                  <ShieldCheck className="h-5 w-5 text-gold" />
                  Segurança no Transporte
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                Todos os pets viajam protegidos por cinto de segurança pet
                certificado no banco traseiro ou em caixas de transporte
                totalmente desinfetadas. Veículo Nissan Livina espaçoso com
                ar-condicionado sempre ligado.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="canc" className="mt-3 rounded-2xl border border-border bg-card px-5">
              <AccordionTrigger className="text-left text-base font-semibold text-navy">
                <span className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-gold" />
                  Política de Cancelamento
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                Cancelamentos de passeios ou táxi são totalmente gratuitos se
                realizados com até 2 horas de antecedência.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="chuva" className="mt-3 rounded-2xl border border-border bg-card px-5">
              <AccordionTrigger className="text-left text-base font-semibold text-navy">
                <span className="flex items-center gap-3">
                  <CloudRain className="h-5 w-5 text-gold" />
                  Dias de Chuva
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                Em caso de chuvas fortes, os passeios externos podem ser
                remarcados ou convertidos em sessões de enriquecimento ambiental
                e gasto de energia indoor na própria casa do cliente.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
            <Button size="lg" className="bg-navy font-semibold text-white hover:bg-navy-deep">
              <MessageCircle className="mr-2 h-5 w-5" />
              Chamar no WhatsApp
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
              <span className="font-display text-lg font-bold">Táxi Dog Alcântara</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Base Operacional em Alcântara, São Gonçalo. Atendimento estendido
              para Niterói, Maricá e Itaboraí.
            </p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gold">
              Serviços
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="#calculadora" className="hover:text-gold">Táxi Dog</a></li>
              <li><a href="#passeios" className="hover:text-gold">Dog Walker</a></li>
              <li><a href="#planos" className="hover:text-gold">Planos mensais</a></li>
              <li><a href="#faq" className="hover:text-gold">Perguntas frequentes</a></li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gold">
              Contato
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gold" /> {PHONE_DISPLAY}
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gold" /> Alcântara, São Gonçalo · RJ
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gold" /> Seg a Sáb · 07h – 20h
              </li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-6xl border-t border-white/10 px-4 pt-6 text-xs text-white/50 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Táxi Dog Alcântara. Todos os direitos reservados.
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Falar no WhatsApp"
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-whatsapp text-white shadow-elegant transition-transform hover:scale-105"
      >
        <MessageCircle className="h-7 w-7" />
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-whatsapp/60" aria-hidden />
      </a>
    </div>
  );
}
