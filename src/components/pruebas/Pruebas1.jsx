import { useEffect, useState } from 'react';
import { supabase } from './client'; // Asegúrate de que la ruta a tu cliente sea correcta

function Pruebas1() {
    const [mensaje, setMensaje] = useState('Conectando con Supabase...');

    useEffect(() => {
        async function ejecutarPrueba() {
            try {
                // Intentamos insertar un registro de prueba
                const { data, error } = await supabase
                    .from('historial_estados')
                    .insert([
                        {
                            maquina_id: 'MAQ-PRUEBA-01',
                            estado: 'PRODUCCION'
                        }
                    ])
                    .select(); // El .select() nos devuelve la fila creada

                if (error) {
                    setMensaje(`❌ Error en Supabase: ${error.message}`);
                    console.error('Detalle del error:', error);
                } else {
                    setMensaje('✅ ¡Conexión exitosa! Fila guardada correctamente.');
                    console.log('Datos guardados:', data);
                }
            } catch (err) {
                setMensaje(`❌ Error crítico en el código: ${err.message}`);
            }
        }

        ejecutarPrueba();
    }, []);

    return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}>
            <h1>Panel de Monitoreo de Tiempos</h1>
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{mensaje}</p>
        </div>
    );
}

export default Pruebas1;
