import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { MapPin, Clock, ShieldCheck, XCircle, ArrowLeft, Maximize2, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// @ts-ignore
L.Marker.prototype.options.icon = DefaultIcon;

interface HistoryItem {
    id: string;
    status: 'SUCCESS' | 'FAILED';
    ipAddress: string | null;
    userAgent: string | null;
    location: string | null;
    latitude: number | null;
    longitude: number | null;
    createdAt: string;
}

export default function LoginHistoryPage() {
    const navigate = useNavigate();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMap, setSelectedMap] = useState<HistoryItem | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Fetch more records for the dedicated history view if BE supports it, or use default list
                const data = await api.get('/auth/history');
                setHistory(data);
            } catch (err) {
                console.error("Failed to load history", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const openEnlargedMap = (item: HistoryItem) => {
        if (item.latitude && item.longitude) {
            setSelectedMap(item);
        }
    };

    const closeMapModal = () => {
        setSelectedMap(null);
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '3rem', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Button 
                        variant="secondary" 
                        onClick={() => navigate('/dashboard')} 
                        style={{ 
                            padding: '0.4rem 0.6rem', 
                            fontSize: '0.75rem', 
                            width: 'auto', 
                            opacity: 0.7, 
                            border: '1px solid var(--border)',
                            background: 'transparent',
                            borderRadius: '6px'
                        }}
                    >
                        <ArrowLeft size={14} /> Volver
                    </Button>
                </div>
                <h1 style={{ margin: 0, fontSize: '3rem', fontWeight: 800, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    Historial de Inicios de Sesión
                </h1>
                <div /> {/* Spacer div to ensure title center */}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '5rem' }}>Cargando historial avanzado...</div>
            ) : history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No se encontró actividad reciente.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', width: '100%' }}>
                    {history.map((item, index) => (
                        <Card 
                            key={item.id} 
                            className="animate-fade-in" 
                            style={{ 
                                padding: '1rem 1.5rem', 
                                display: 'flex', 
                                gap: '2rem', 
                                alignItems: 'center', 
                                minHeight: '100px',
                                width: '75%',
                                maxWidth: '1200px',
                                minWidth: '700px',
                                margin: 0, 
                                borderRadius: index === 0 ? '14px 14px 4px 4px' : (index === history.length - 1 ? '4px 4px 14px 14px' : '4px'),
                                boxShadow: 'none', 
                                borderBottom: index === history.length - 1 ? '1px solid var(--border)' : 'none'
                            }}
                        >
                            {/* Left Side: Consolidated Details - High Readability */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {/* Header: Status (Large & Bold) vs Date */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        {item.status === 'SUCCESS' ? <ShieldCheck size={20} color="var(--success)" /> : <XCircle size={20} color="var(--error)" />}
                                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: item.status === 'SUCCESS' ? 'var(--success)' : 'var(--error)' }}>
                                            {item.status === 'SUCCESS' ? 'Acceso Autorizado' : 'Fallo de Autenticación'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                                        <Clock size={16} />
                                        {new Date(item.createdAt).toLocaleString()}
                                    </div>
                                </div>

                                {/* Body Information: Expanded Visibility */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 220px) 1.5fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Dirección IP</span>
                                        <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                                            {item.ipAddress || 'Dirección Desconocida'}
                                        </p>
                                    </div>
                                    <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.25rem' }}>
                                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Ubicación Física</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <MapPin size={16} color="var(--primary)" />
                                            <span style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                                                {item.location || 'Localización No Disponible'}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.25rem' }}>
                                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Agente Usuario</span>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', wordBreak: 'break-all', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {item.userAgent || 'Desconocido'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Map Micro-Preview (Interactive) */}
                            <div
                                style={{
                                    width: '150px',
                                    height: '75px',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    border: '1px solid var(--border)',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    flexShrink: 0
                                }}
                                onClick={() => openEnlargedMap(item)}
                            >
                                {item.latitude && item.longitude ? (
                                    <>
                                        <MapContainer
                                            center={[item.latitude, item.longitude]}
                                            zoom={10}
                                            style={{ height: '100%', width: '100%', pointerEvents: 'none' }}
                                            zoomControl={false}
                                            dragging={false}
                                            scrollWheelZoom={false}
                                            doubleClickZoom={false}
                                        >
                                            <TileLayer
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                attribution=""
                                            />
                                            <Marker position={[item.latitude, item.longitude]} />
                                        </MapContainer>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            background: 'rgba(99, 102, 241, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backdropFilter: 'blur(1px)',
                                            opacity: 0,
                                            transition: 'opacity 0.2s'
                                        }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}>
                                            <Maximize2 size={18} color="#fff" />
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ height: '100%', width: '100%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                        Sin Mapa
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}




            {/* Modal for Enlarged Map */}
            {selectedMap && selectedMap.latitude && selectedMap.longitude && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(4px)',
                    padding: '2rem'
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '900px',
                        background: 'var(--card-bg)',
                        borderRadius: '0.5rem',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }} className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin color="var(--primary)" />
                                {selectedMap.location || 'Ubicación'}
                            </h3>
                            <button
                                onClick={closeMapModal}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ height: '60vh', width: '100%' }}>
                            <MapContainer
                                center={[selectedMap.latitude, selectedMap.longitude]}
                                zoom={13}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                />
                                <Marker position={[selectedMap.latitude, selectedMap.longitude]}>
                                    <Popup>
                                        <strong>{selectedMap.status === 'SUCCESS' ? 'Inicio de Sesión Exitoso' : 'Intento Fallido'}</strong>
                                        <br />
                                        IP: {selectedMap.ipAddress}
                                        <br />
                                        Fecha: {new Date(selectedMap.createdAt).toLocaleString()}
                                    </Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
