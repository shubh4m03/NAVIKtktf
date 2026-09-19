import React, { useState } from 'react';
import { CreateCargoRequestDto } from '../lib/api-client';

interface CargoInputFormProps {
  onSubmit: (dto: CreateCargoRequestDto) => Promise<void>;
  isLoading: boolean;
}

export const CargoInputForm: React.FC<CargoInputFormProps> = ({ onSubmit, isLoading }) => {
  const [tonnage, setTonnage] = useState<number>(75000);
  const [originRegion, setOriginRegion] = useState<string>('AUSTRALIA_NEWCASTLE');
  const [destinationPortId, setDestinationPortId] = useState<number>(1);
  const [deadline, setDeadline] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 35);
    return d.toISOString().split('T')[0];
  });
  const [contractPreference, setContractPreference] = useState<string>('spot');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      tonnage,
      originRegion,
      destinationPortId,
      deadline,
      contractPreference,
    });
  };

  return (
    <form
      data-testid="cargo-input-form"
      onSubmit={handleSubmit}
      style={{
        backgroundColor: '#0f172a',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '32px',
        color: '#f8fafc',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.25)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc' }}>
          <span>📋</span> Cargo Requirement Specification
        </h2>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
          Input drives end-to-end multi-stage pipeline
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Tonnage */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cbd5e1', marginBottom: '8px' }}>
            Cargo Tonnage (MT)
          </label>
          <input
            type="number"
            data-testid="input-tonnage"
            value={tonnage}
            onChange={(e) => setTonnage(Number(e.target.value))}
            min={1000}
            step={1000}
            required
            style={{
              width: '100%',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#f8fafc',
              fontSize: '14px',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
        </div>

        {/* Origin Region */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cbd5e1', marginBottom: '8px' }}>
            Origin Region
          </label>
          <select
            data-testid="select-origin"
            value={originRegion}
            onChange={(e) => setOriginRegion(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#f8fafc',
              fontSize: '14px',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          >
            <option value="AUSTRALIA_NEWCASTLE">Australia (Newcastle / Hay Point)</option>
            <option value="US_EAST_COAST">US East Coast (Hampton Roads)</option>
            <option value="MOZAMBIQUE_NACALA">Mozambique (Nacala / Beira)</option>
            <option value="RUSSIA_FAR_EAST">Russia (Vostochny / Vanino)</option>
            <option value="INDONESIA_KALIMANTAN">Indonesia (Kalimantan / Muara Satui)</option>
          </select>
        </div>

        {/* Destination Port */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cbd5e1', marginBottom: '8px' }}>
            Destination Discharge Port
          </label>
          <select
            data-testid="select-port"
            value={destinationPortId}
            onChange={(e) => setDestinationPortId(Number(e.target.value))}
            style={{
              width: '100%',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#f8fafc',
              fontSize: '14px',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          >
            <option value={1}>Paradip Port (Draft: 14.5m, Mechanized Coal Berth)</option>
            <option value={2}>Visakhapatnam Port (Draft: 16.5m, Outer Harbor)</option>
            <option value={3}>Haldia Dock Complex (Draft: 8.5m, Shallow Riverine)</option>
            <option value={4}>Dhamra Port (Draft: 17.5m, Deepwater Capesize)</option>
          </select>
        </div>

        {/* Deadline Date */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cbd5e1', marginBottom: '8px' }}>
            Delivery Deadline
          </label>
          <input
            type="date"
            data-testid="input-deadline"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
            style={{
              width: '100%',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#f8fafc',
              fontSize: '14px',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        {/* Contract Preference */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cbd5e1', marginBottom: '8px' }}>
            Contract Preference
          </label>
          <select
            data-testid="select-contract"
            value={contractPreference}
            onChange={(e) => setContractPreference(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#f8fafc',
              fontSize: '14px',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          >
            <option value="spot">Spot Market Fixture (T+0 to T+7 fixing)</option>
            <option value="short">Short-Term CoA (1 to 3 months)</option>
            <option value="medium">Medium-Term Time Charter (6 to 12 months)</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <button
          type="submit"
          data-testid="btn-submit-cargo"
          disabled={isLoading}
          style={{
            backgroundColor: isLoading ? '#475569' : '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '11px 26px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
            transition: 'all 0.2s',
          }}
        >
          {isLoading ? (
            <>
              <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
              Executing Optimization Pipeline...
            </>
          ) : (
            <>
              <span>⚡</span> Run Full Decision Pipeline
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CargoInputForm;
