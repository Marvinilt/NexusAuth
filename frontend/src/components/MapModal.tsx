import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, X, CheckCircle2, XCircle, Globe, Calendar, User, Building2 } from 'lucide-react';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Configuración de iconos por defecto para marcadores de Leaflet en Vite/React
const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

// @ts-ignore
L.Marker.prototype.options.icon = DefaultIcon;

/**
 * Estructura de datos requerida para renderizar el modal de ubicación geográfica.
 */
export interface MapModalData {
    id?: string;
    location: string | null;
    latitude: number;
    longitude: number;
    ipAddress?: string | null;
    userAgent?: string | null;
    status?: 'SUCCESS' | 'FAILED';
    createdAt?: string;
    userEmail?: string | null;
    clientName?: string | null;
}

/**
 * Propiedades para el componente MapModal.
 */
export interface MapModalProps {
    data: MapModalData | null;
    onClose: () => void;
}

/**
 * Componente modal para la visualización interactiva de coordenadas en un mapa Leaflet.
 * Incluye cierre mediante la tecla Escape, click fuera del modal y detalles de auditoría.
 */
export const MapModal: React.FC<MapModalProps> = ({ data, onClose }) => {
    // Manejo de la tecla Escape para cerrar el modal de forma accesible
    useEffect(() => {
        if (!data) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [data, onClose]);

    if (!data || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
        return null;
    }

    const isSuccess = data.status === 'SUCCESS';

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="map-modal-title"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(10, 15, 29, 0.82)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(6px)',
                padding: '1.5rem'
            }}
            onClick={(e) => {
                // Si hace click directamente en el overlay oscuro exterior, cerrar el modal
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '850px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
                    animation: 'fadeIn 0.2s ease-out'
                }}
            >
                {/* Cabecera del Modal */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1.25rem 1.75rem',
                        borderBottom: '1px solid var(--border)',
                        background: 'rgba(30, 41, 59, 0.5)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: 'rgba(99, 102, 241, 0.15)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <MapPin size={20} color="var(--primary)" />
                        </div>
                        <div>
                            <h3
                                id="map-modal-title"
                                style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}
                            >
                                {data.location || 'Ubicación Geográfica'}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                    Lat: {data.latitude.toFixed(4)}, Lng: {data.longitude.toFixed(4)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {data.status && (
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    padding: '0.3rem 0.7rem',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    background: isSuccess ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    color: isSuccess ? 'var(--success)' : '#f87171',
                                    border: `1px solid ${isSuccess ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                                }}
                            >
                                {isSuccess ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                {isSuccess ? 'Acceso Exitoso' : 'Acceso Fallido'}
                            </span>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Cerrar modal de mapa"
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '0.45rem',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                e.currentTarget.style.color = '#fca5a5';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Mapa Leaflet */}
                <div style={{ height: '420px', width: '100%', position: 'relative' }}>
                    <MapContainer
                        center={[data.latitude, data.longitude]}
                        zoom={12}
                        style={{ height: '100%', width: '100%', zIndex: 1 }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
                        />
                        <Marker position={[data.latitude, data.longitude]}>
                            <Popup>
                                <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                                    <strong style={{ color: isSuccess ? '#16a34a' : '#dc2626' }}>
                                        {isSuccess ? 'Sesión Autorizada' : 'Intento Fallido'}
                                    </strong>
                                    {data.userEmail && (
                                        <div style={{ marginTop: '4px' }}>
                                            <strong>Usuario:</strong> {data.userEmail}
                                        </div>
                                    )}
                                    {data.clientName && (
                                        <div>
                                            <strong>Sistema:</strong> {data.clientName}
                                        </div>
                                    )}
                                    {data.ipAddress && (
                                        <div>
                                            <strong>IP:</strong> {data.ipAddress}
                                        </div>
                                    )}
                                    {data.createdAt && (
                                        <div>
                                            <strong>Fecha:</strong> {new Date(data.createdAt).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    </MapContainer>
                </div>

                {/* Pie de Auditoría del Registro */}
                <div
                    style={{
                        padding: '1rem 1.5rem',
                        background: 'rgba(15, 23, 42, 0.7)',
                        borderTop: '1px solid var(--border)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '1rem',
                        fontSize: '0.8rem'
                    }}
                >
                    {data.userEmail && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                            <User size={15} color="var(--primary)" />
                            <div>
                                <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuario</span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{data.userEmail}</span>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                        <Building2 size={15} color="#38bdf8" />
                        <div>
                            <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sistema Cliente</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{data.clientName || 'NexusAuth Directo'}</span>
                        </div>
                    </div>

                    {data.ipAddress && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                            <Globe size={15} color="#a855f7" />
                            <div>
                                <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dirección IP</span>
                                <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: 600 }}>{data.ipAddress}</span>
                            </div>
                        </div>
                    )}

                    {data.createdAt && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                            <Calendar size={15} color="#eab308" />
                            <div>
                                <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha y Hora</span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{new Date(data.createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
