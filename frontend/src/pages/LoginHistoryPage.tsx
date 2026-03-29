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
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
                <Button variant="secondary" onClick={() => navigate('/dashboard')} style={{ padding: '0.5rem' }}>
                    <ArrowLeft size={18} /> Volver al Panel
                </Button>
                <h1 style={{ margin: 0, flex: 1 }}>Historial de Inicios de Sesión</h1>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando historial avanzado...</div>
            ) : history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No se encontró actividad reciente.</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                    {history.map((item) => (
                        <Card key={item.id} className="animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {item.status === 'SUCCESS' ? <ShieldCheck size={20} color="var(--success)" /> : <XCircle size={20} color="var(--error)" />}
                                    <span style={{ fontWeight: 600, color: item.status === 'SUCCESS' ? 'var(--success)' : 'var(--error)' }}>
                                        {item.status === 'SUCCESS' ? 'Inicio de Sesión Exitoso' : 'Intento de Inicio Fallido'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    <Clock size={14} />
                                    {new Date(item.createdAt).toLocaleString()}
                                </div>
                            </div>

                            <div style={{ flex: 1, marginBottom: '1rem' }}>
                                <p style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                    <strong>IP:</strong> {item.ipAddress || 'Unknown'}
                                </p>
                                <p style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem' }}>
                                    <MapPin size={16} style={{ marginTop: '0.2rem', flexShrink: 0, color: 'var(--primary)' }} />
                                    <span style={{ flex: 1 }}>{item.location || 'Location Not Available'}</span>
                                </p>
                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                                    <strong>Dispositivo:</strong> {item.userAgent || 'Desconocido'}
                                </p>
                            </div>

                            {item.latitude && item.longitude ? (
                                <div
                                    style={{
                                        height: '150px',
                                        borderRadius: '0.5rem',
                                        overflow: 'hidden',
                                        border: '1px solid var(--border)',
                                        position: 'relative',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => openEnlargedMap(item)}
                                >
                                    <MapContainer
                                        center={[item.latitude, item.longitude]}
                                        zoom={10}
                                        style={{ height: '100%', width: '100%', pointerEvents: 'none' }} // disable interaction on mini-map
                                        zoomControl={false}
                                        dragging={false}
                                        scrollWheelZoom={false}
                                        doubleClickZoom={false}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        />
                                        <Marker position={[item.latitude, item.longitude]} />
                                    </MapContainer>
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '0.5rem',
                                        right: '0.5rem',
                                        background: 'rgba(15, 23, 42, 0.8)',
                                        color: '#fff',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.25rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        fontSize: '0.75rem',
                                        backdropFilter: 'blur(4px)',
                                        zIndex: 1000
                                    }}>
                                        <Maximize2 size={12} /> Ampliar Mapa
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    height: '150px',
                                    borderRadius: '0.5rem',
                                    border: '1px dashed var(--border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.9rem',
                                    background: 'rgba(255,255,255,0.02)'
                                }}>
                                    Datos del mapa no disponibles
                                </div>
                            )}
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
