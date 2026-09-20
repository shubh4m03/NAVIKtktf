'use client'

import { CargoShipScene } from "@/components/ui/cargo-ship-scene";
import { Card } from "@/components/ui/card"
import { Spotlight } from "@/components/ui/spotlight"
import { Ship, Anchor, Navigation } from "lucide-react"
 
export function CargoShipSceneHero() {
  return (
    <Card className="w-full h-[500px] bg-black/[0.96] relative overflow-hidden border-border-subtle rounded-none">
      
      <div className="flex h-full flex-col md:flex-row">
        {/* Left content */}
        <div className="w-full md:w-1/3 p-8 relative z-10 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
             <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary border border-brand-primary/30">
                <Ship className="w-4 h-4" />
             </div>
             <span className="text-brand-primary text-xs font-mono tracking-widest uppercase font-bold">Live Fleet Telemetry</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
            Track Every Vessel, Live
          </h1>
          <p className="mt-4 text-neutral-300 leading-relaxed text-sm">
            Real-time maritime intelligence powered by a live 3D fleet view.
            Monitor cargo vessels, routes, and port disruptions as they happen.
          </p>
          <div className="mt-8 flex gap-4">
             <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
               <Navigation className="w-4 h-4 text-brand-primary" /> Active Routes: 24,105
             </div>
             <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
               <Anchor className="w-4 h-4 text-brand-primary" /> Ports: 4,002
             </div>
          </div>
        </div>

        {/* Right content - Increased area for the 3D model */}
        <div className="w-full md:w-2/3 relative min-h-[300px]">
          <CargoShipScene className="w-full h-full" />
        </div>
      </div>
    </Card>
  )
}
