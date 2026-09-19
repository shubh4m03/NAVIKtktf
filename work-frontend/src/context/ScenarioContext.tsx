import React, { createContext, useContext, useState, useEffect } from 'react';

export interface GlobalScenario {
  cargo: { commodity: string; parcelSizeMt: number; isPerishable: boolean };
  lane: { originPortId: string; destPortId: string; laycanStart: string; laycanEnd: string };
  vessel: { classId: string | null; operatingDraftM: number; serviceSpeedKts: number };
}

interface ScenarioContextType {
  scenario: GlobalScenario;
  updateScenario: (partial: Partial<GlobalScenario>) => void;
  updateCargo: (partial: Partial<GlobalScenario['cargo']>) => void;
  updateLane: (partial: Partial<GlobalScenario['lane']>) => void;
  updateVessel: (partial: Partial<GlobalScenario['vessel']>) => void;
}

const defaultScenario: GlobalScenario = {
  cargo: { commodity: 'dry-bulk', parcelSizeMt: 70000, isPerishable: false },
  lane: { originPortId: 'port-1', destPortId: 'port-1', laycanStart: new Date().toISOString(), laycanEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() },
  vessel: { classId: 'vessel-panamax', operatingDraftM: 14.0, serviceSpeedKts: 14 },
};

const ScenarioContext = createContext<ScenarioContextType | undefined>(undefined);

export function ScenarioProvider({ children }: { children: React.ReactNode }) {
  const [scenario, setScenario] = useState<GlobalScenario>(() => {
    try {
      const saved = sessionStorage.getItem('navik_scenario');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.vessel && parsed.vessel.classId) {
          return {
            ...defaultScenario,
            ...parsed,
            vessel: { ...defaultScenario.vessel, ...parsed.vessel }
          };
        }
      }
    } catch (e) {
      console.error('Failed to parse scenario from session storage', e);
    }
    return defaultScenario;
  });

  useEffect(() => {
    sessionStorage.setItem('navik_scenario', JSON.stringify(scenario));
  }, [scenario]);

  const updateScenario = (partial: Partial<GlobalScenario>) => {
    setScenario(prev => ({ ...prev, ...partial }));
  };

  const updateCargo = (partial: Partial<GlobalScenario['cargo']>) => {
    setScenario(prev => ({ ...prev, cargo: { ...prev.cargo, ...partial } }));
  };

  const updateLane = (partial: Partial<GlobalScenario['lane']>) => {
    setScenario(prev => ({ ...prev, lane: { ...prev.lane, ...partial } }));
  };

  const updateVessel = (partial: Partial<GlobalScenario['vessel']>) => {
    setScenario(prev => ({ ...prev, vessel: { ...prev.vessel, ...partial } }));
  };

  return (
    <ScenarioContext.Provider value={{ scenario, updateScenario, updateCargo, updateLane, updateVessel }}>
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario() {
  const context = useContext(ScenarioContext);
  if (context === undefined) {
    throw new Error('useScenario must be used within a ScenarioProvider');
  }
  return context;
}
