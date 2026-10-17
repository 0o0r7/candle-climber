import CityCanvas from "@/components/city/CityCanvas";

export const metadata = {
  title: "CHAIN CITY — Build your economy on real market data",
  description:
    "An economy-driven city builder where every building runs on live stock token prices. Build your city in 3D and watch income follow the market. Progress saves locally — or online with a wallet.",
};

export default function CityPage() {
  return <CityCanvas />;
}
