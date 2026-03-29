import React, { useState, useMemo, useEffect } from 'react'
import * as XLSX from 'xlsx'
import './Read.css'
import * as echarts from 'echarts';


const Read = () => {

    const [data, setData] = useState([])
    // Estado para almacenar los nombres de las columnas del archivo
    const [columns, setColumns] = useState([])
    // Estado para guardar qué columnas están seleccionadas para los ejes del gráfico (x: categoría, y: valor)
    const [selectedColumns, setSelectedColumns] = useState({ x: '', y: '' })
    // Estado para definir el tipo de gráfico a mostrar (bar, line, pie)
    const [chartType, setChartType] = useState('bar')
    // Estado para definir la orientación del gráfico (vertical, horizontal)
    const [chartOrientation, setChartOrientation] = useState('horizontal')
    // Estado de referencia seleccionada para detalle
    const [selectedReferencia, setSelectedReferencia] = useState(null)
    // Estado para controlar referencias expandibles
    const [expandedRefs, setExpandedRefs] = useState({})
    // Estado para controlar indicadores de carga
    const [isProcessing, setIsProcessing] = useState(false)
    // Estado para guardar el nombre del archivo cargado
    const [fileName, setFileName] = useState('')

    const [anio, setAnio] = useState([]);
    const [mes, setMes] = useState([]);
    const meses = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

    // Función que se ejecuta cuando el usuario selecciona un archivo
    const handleFileUpload = (event) => {
        // Obtener el primer archivo de los archivos seleccionados
        const file = event.target.files[0]
        // Si no hay archivo, salir de la función
        if (!file) return
        // Activar indicador de procesamiento
        setIsProcessing(true)
        // Guardar el nombre del archivo en el estado
        setFileName(file.name)
        // Crear una instancia de FileReader para leer el archivo
        const reader = new FileReader()

        // Ejecutar código cuando el archivo se haya cargado completamente
        reader.onload = (e) => {
            try {
                // Leer el archivo Excel con XLSX
                const workbook = XLSX.read(e.target.result, { type: 'binary' })
                // Obtener el nombre de la primera hoja del Excel
                const firstSheet = workbook.SheetNames[0]
                // Acceder a la hoja específica
                const worksheet = workbook.Sheets[firstSheet]
                // Convertir los datos de la hoja a formato JSON (array de objetos)
                const jsonData = XLSX.utils.sheet_to_json(worksheet)

                // Si hay datos en el archivo
                if (jsonData.length > 0) {
                    // Calcular columna de cumplimiento para cada fila
                    const dataWithCumplimiento = jsonData.map(row => {
                        const totalPaquetes = parseFloat(row["TOTAL PAQUETES"]) || 0
                        const paquetesCompletados = parseFloat(row["PAQUETES COMPLETADOS"]) || 0
                        const cumplimiento = totalPaquetes > 0 ? ((paquetesCompletados / totalPaquetes) * 100) : 0

                        return {
                            ...row,
                            "CUMPLIMIENTO (%)": cumplimiento
                        }
                    })

                    // Guardar los datos en el estado
                    setData(dataWithCumplimiento)
                    // Extraer los nombres de las columnas (claves del primer objeto)
                    setColumns(Object.keys(dataWithCumplimiento[0]))
                    // Establecer columnas predeterminadas para los ejes del gráfico
                    // x: primera columna / y: segunda columna (o la primera si solo hay una)
                    setSelectedColumns({
                        x: Object.keys(dataWithCumplimiento[0])[0],
                        y: "CUMPLIMIENTO (%)"
                    })
                }
            } catch (error) {
                // Si ocurre un error, mostrar un mensaje de alerta
                alert('Error al leer el archivo Excel: ' + error.message)
            } finally {
                // Desactivar indicador de procesamiento
                setIsProcessing(false)
            }
        }

        // Leer el archivo en formato binario
        reader.readAsBinaryString(file)
    }

    // OPTIMIZACIÓN: Memoizar opciones de años para evitar recálculos
    const años = useMemo(() => {
        if (!data.length) return []
        const fechas = data.map(r => r["FECHA INICIO PAQUETE"]?.toString().substring(0, 4))
        return [...new Set(fechas.filter(f => f))].sort()
    }, [data])

    // OPTIMIZACIÓN: Memoizar datos filtrados para evitar recálculos innecesarios
    const filtrados = useMemo(() => {
        if (!data.length) return []

        return data.filter(row => {
            const f = row["FECHA INICIO PAQUETE"]?.toString();
            if (!f || f.length < 7) return false
            const rowAnio = f.substring(0, 4)
            const rowMes = f.substring(5, 7)

            const coincideAnio = !anio.length || anio.includes(rowAnio);
            const coincideMes = !mes.length || mes.includes(rowMes);
            return coincideAnio && coincideMes;
        });
    }, [data, anio, mes]);


    // 1. Identificar las columnas exactas
    const colOP = Object.keys(filtrados[0] || {}).find(k => k.trim().toLowerCase() === "op");
    const colReferencia = Object.keys(filtrados[0] || {}).find(k => k.trim().toLowerCase().includes("referencia"));

    // 2. Agrupar por referencia, sumando los valores numéricos y promediando cumplimiento
    const datosAgrupados = useMemo(() => {
        if (!filtrados.length || !colReferencia) return filtrados

        const grouped = filtrados.reduce((acc, row) => {
            const ref = row[colReferencia] || 'Sin Referencia'

            if (!acc[ref]) {
                acc[ref] = {
                    ...row,
                    _count: 1,
                    _cumplimientos: [Number(row["CUMPLIMIENTO (%)"]) || 0],
                    _ops: [row],
                    _sums: {}
                }

                // Iniciar suma para columnas numéricas (parsear strings a número)
                columns.forEach(col => {
                    if (col === colReferencia || col === "CUMPLIMIENTO (%)") return
                    const raw = row[col]
                    const num = parseFloat(raw)
                    if (!Number.isNaN(num)) {
                        acc[ref]._sums[col] = num
                        acc[ref][col] = num
                    } else {
                        acc[ref][col] = raw
                    }
                })
            } else {
                acc[ref]._count += 1
                acc[ref]._cumplimientos.push(Number(row["CUMPLIMIENTO (%)"]) || 0)
                acc[ref]._ops.push(row)

                // Sumar valores numéricos (excepto cumplimiento y referencia)
                columns.forEach(col => {
                    if (col === colReferencia || col === "CUMPLIMIENTO (%)") return
                    const raw = row[col]
                    const num = parseFloat(raw)
                    if (!Number.isNaN(num)) {
                        acc[ref]._sums[col] = (acc[ref]._sums[col] || 0) + num
                        acc[ref][col] = acc[ref]._sums[col] / acc[ref]._count
                    }
                })
            }

            return acc
        }, {})

        // Calcular promedio por referencia.
        // Si hay columna OP, calcular primero por OP y luego promediar los promedios de OP.
        Object.values(grouped).forEach(item => {
            const refs = item._ops || []
            const colNumericas = columns.filter(col => col !== colReferencia && col !== "CUMPLIMIENTO (%)")

            if (colOP && refs.length > 0) {
                const opGroups = refs.reduce((acc, op) => {
                    const opName = String(op[colOP] || op['OP'] || 'OP')
                    if (!acc[opName]) {
                        acc[opName] = { count: 0, cumplimientoSum: 0, sums: {} }
                    }

                    acc[opName].count += 1
                    acc[opName].cumplimientoSum += Number(op['CUMPLIMIENTO (%)']) || 0

                    colNumericas.forEach(col => {
                        const num = parseFloat(op[col])
                        if (!Number.isNaN(num)) {
                            acc[opName].sums[col] = (acc[opName].sums[col] || 0) + num
                        }
                    })

                    return acc
                }, {})

                const opAverages = Object.values(opGroups).map(opItem => {
                    const opAvg = { cumplimiento: opItem.cumplimientoSum / opItem.count }
                    colNumericas.forEach(col => {
                        if (opItem.sums[col] !== undefined) {
                            opAvg[col] = opItem.sums[col] / opItem.count
                        }
                    })
                    return opAvg
                })

                if (opAverages.length > 0) {
                    // CUMPLIMIENTO (%) se promedia entre OPs; el resto de columnas se suman los promedios OP
                    const avgCumpl = opAverages.reduce((sum, opAvg) => sum + opAvg.cumplimiento, 0) / opAverages.length
                    item['CUMPLIMIENTO (%)'] = Number(avgCumpl.toFixed(2))

                    colNumericas.forEach(col => {
                        const validOps = opAverages.filter(opAvg => typeof opAvg[col] === 'number')
                        if (validOps.length) {
                            const sumCol = validOps.reduce((sum, opAvg) => sum + opAvg[col], 0)
                            item[col] = Number(sumCol.toFixed(2))
                        }
                    })
                }
            } else {
                const avgCumplimiento = item._cumplimientos.reduce((sum, val) => sum + val, 0) / item._cumplimientos.length
                item['CUMPLIMIENTO (%)'] = Number(avgCumplimiento.toFixed(2))

                colNumericas.forEach(col => {
                    if (item._sums[col] !== undefined) {
                        item[col] = Number((item._sums[col] / item._count).toFixed(2))
                    }
                })
            }
        })

        return Object.values(grouped)
    }, [filtrados, colReferencia, columns, colOP])

    // // 3. Quitar duplicados por referencia (por si acaso)
    // const datosUnicos = datosAgrupados.filter((item, index, self) =>
    //     index === self.findIndex(t => t[colReferencia] === item[colReferencia])
    // );

    // OPTIMIZACIÓN: Limitar datos mostrados en tabla (primeros 50 registros agrupados)
    const datosTabla = useMemo(() => {
        return datosAgrupados.slice(0, 50)
    }, [datosAgrupados])

    // Configurar ECharts cuando cambian los datos o el tipo de gráfico
    useEffect(() => {
        if (!datosAgrupados.length || !selectedColumns.x || !selectedColumns.y) return

        const chartDom = document.getElementById('main')
        if (!chartDom) return

        const myChart = echarts.init(chartDom)

        let option = {}

        if (selectedReferencia) {
            const referenciaData = datosAgrupados.find(item => String(item[colReferencia]) === String(selectedReferencia))
            if (!referenciaData || !referenciaData._ops?.length) {
                // Si no hay datos de OP, mostramos resumen completo en lugar de error
                selectedReferencia && setSelectedReferencia(null)
            } else {
                // Agrupar por OP
                const opGroups = referenciaData._ops.reduce((acc, op) => {
                    const opName = String(op[colOP] || op['OP'] || 'OP')
                    const cumpl = Number(op['CUMPLIMIENTO (%)']) || 0
                    if (!acc[opName]) {
                        acc[opName] = { name: opName, total: cumpl, count: 1 }
                    } else {
                        acc[opName].total += cumpl
                        acc[opName].count += 1
                    }
                    return acc
                }, {})

                const opData = Object.values(opGroups).map(item => ({
                    name: item.name,
                    value: Number((item.total / item.count).toFixed(2)),
                    count: item.count
                }))

                const isHorizontal = chartOrientation === 'horizontal'

                option = {
                    title: {
                        text: `Detalle OPs: ${selectedReferencia}`,
                        left: 'center'
                    },
                    tooltip: {
                        trigger: chartType === 'pie' ? 'item' : 'axis',
                        formatter: chartType === 'pie' ? '{b}: {c}%' : '{b}: {c}%'
                    },
                    xAxis: chartType === 'bar' ? (isHorizontal ? {
                        type: 'value',
                        name: 'Cumplimiento %',
                        max: 100,
                        axisLabel: { formatter: '{value}%' }
                    } : {
                        type: 'category',
                        data: opData.map(o => o.name),
                        axisLabel: {
                            interval: 0,
                            rotate: 45,
                            formatter: function (value) {
                                return value.length > 20 ? value.substring(0, 17) + '...' : value
                            }
                        }
                    }) : {
                        type: 'category',
                        data: opData.map(o => o.name),
                        axisLabel: {
                            interval: 0,
                            rotate: 45,
                            formatter: function (value) {
                                return value.length > 20 ? value.substring(0, 17) + '...' : value
                            }
                        }
                    },
                    yAxis: chartType === 'bar' ? (isHorizontal ? {
                        type: 'category',
                        data: opData.map(o => o.name),
                        axisLabel: {
                            interval: 0,
                            formatter: function (value) {
                                return value.length > 20 ? value.substring(0, 17) + '...' : value
                            }
                        }
                    } : {
                        type: 'value',
                        name: 'Cumplimiento %',
                        max: 100,
                        axisLabel: { formatter: '{value}%' }
                    }) : {
                        type: 'value'
                    },
                    series: [{
                        name: 'CUMPLIMIENTO (%)',
                        type: chartType,
                        data: opData.map(o => o.value),
                        itemStyle: {
                            color: '#8884d8'
                        },
                        label: {
                            show: true,
                            position: chartType === 'bar' ? (isHorizontal ? 'right' : 'top') : 'inside',
                            formatter: '{c}%'
                        }
                    }],
                    dataZoom: chartType === 'bar' && opData.length > 10 ? [{
                        type: 'slider',
                        yAxisIndex: isHorizontal ? 0 : null,
                        xAxisIndex: isHorizontal ? null : 0,
                        start: 0,
                        end: 50
                    }] : []
                }
            }
        } else {
            // AGRUPAR datos por columna X y sumar valores de columna Y
            const groupedData = datosAgrupados.reduce((acc, row) => {
                const key = row[selectedColumns.x] // Valor de la columna X (categoría)
                const value = parseFloat(row[selectedColumns.y]) || 0 // Valor numérico de columna Y

                if (acc[key]) {
                    acc[key] += value
                } else {
                    acc[key] = value
                }
                return acc
            }, {})

            const chartData = Object.entries(groupedData).map(([name, value]) => ({
                name: name,
                value: value
            }))

            if (chartType === 'bar') {
                const isHorizontal = chartOrientation === 'horizontal'
                option = {
                    title: {
                        text: `Circulares PD`
                    },
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                            type: 'shadow'
                        },
                        formatter: function (params) {
                            let result = params[0]?.name + '<br/>'
                            params.forEach(param => {
                                const value = param.value
                                const label = param.seriesName === 'CUMPLIMIENTO (%)' ? `${value}%` : value
                                result += param.marker + param.seriesName + ': ' + label + '<br/>'
                            })
                            return result
                        }
                    },
                    grid: {
                        left: isHorizontal ? '10%' : '10%',
                        right: '10%',
                        bottom: '10%',
                        top: '10%',
                        containLabel: true
                    },
                    xAxis: isHorizontal ? {
                        type: 'value',
                        axisLabel: {
                            formatter: '{value}'
                        }
                    } : {
                        type: 'category',
                        data: chartData.map(item => item.name),
                        axisLabel: {
                            interval: 0,
                            rotate: 45
                        }
                    },
                    yAxis: isHorizontal ? {
                        type: 'category',
                        data: chartData.map(item => item.name),
                        inverse: true,
                        axisLabel: {
                            interval: 0,
                            formatter: function (value) {
                                return value.length > 25 ? value.substring(0, 22) + '...' : value;
                            },
                            width: 200,
                            overflow: 'truncate'
                        }
                    } : {
                        type: 'value',
                        axisLabel: {
                            formatter: '{value}'
                        }
                    },
                    series: [{
                        data: chartData.map(item => item.value),
                        type: 'bar',
                        itemStyle: {
                            color: '#8884d8'
                        },
                        label: {
                            show: true,
                            position: isHorizontal ? 'right' : 'top',
                            formatter: '{c}'
                        }
                    }],
                    dataZoom: isHorizontal && datosAgrupados.length > 10 ? [{
                        type: 'slider',
                        yAxisIndex: 0,
                        start: 0,
                        end: 50,
                    },
                    {
                        type: 'inside',
                        yAxisIndex: 0,
                        zoomOnMouseWheel: false, // Activa el zoom con la rueda
                        moveOnMouseMove: true   // Permite "arrastrar" el gráfico con el mouse
                    }] : []
                }
            } else if (chartType === 'line') {
                option = {
                    title: {
                        text: 'Gráfico de Líneas'
                    },
                    tooltip: {
                        trigger: 'axis'
                    },
                    xAxis: {
                        type: 'category',
                        data: chartData.map(item => item.name)
                    },
                    yAxis: {
                        type: 'value'
                    },
                    series: [{
                        data: chartData.map(item => item.value),
                        type: 'line',
                        smooth: true,
                        itemStyle: {
                            color: '#8884d8'
                        }
                    }]
                }
            } else if (chartType === 'pie') {
                option = {
                    title: {
                        text: 'Gráfico de Pastel'
                    },
                    tooltip: {
                        trigger: 'item'
                    },
                    legend: {
                        orient: 'vertical',
                        left: 'left'
                    },
                    series: [{
                        name: selectedColumns.y,
                        type: 'pie',
                        radius: '50%',
                        data: chartData.map(item => ({
                            value: item.value,
                            name: item.name
                        })),
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }]
                }
            }
        }

        myChart.setOption(option)

        // Click en barras de resumen: entrar a detalle
        myChart.on('click', (params) => {
            if (selectedReferencia) return
            const referencia = params?.name
            if (referencia === undefined || referencia === null) return
            const valor = String(referencia)
            setSelectedReferencia(valor)
            setExpandedRefs(prev => ({ ...prev, [valor]: !prev[valor] }))
        })

        const handleResize = () => {
            myChart.resize()
        }

        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
            myChart.off('click')
            myChart.dispose()
        }
    }, [datosAgrupados, selectedColumns, chartType, chartOrientation, selectedReferencia, colReferencia, colOP])

    // Renderizar el JSX del componente
    return (
        <div className="read-container">
            {/* Título principal */}
            <h2>Lector Paqueteria</h2>

            {/* SECCIÓN 1: Carga de archivo */}
            <div className="upload-section">
                <label className="file-label">
                    {/* Input tipo file (oculto visualmente) que acepta archivos Excel */}
                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        className="file-input"
                    />
                    {/* Botón visible para seleccionar archivo */}
                    <span className="file-button">📁 Seleccionar Archivo</span>
                </label>
                {/* Mostrar el nombre del archivo si ya se ha cargado */}
                {fileName && <p className="file-name">✓ Archivo cargado: {fileName}</p>}
                {colReferencia && <p className="file-name">📋 Agrupando por: {colReferencia}</p>}
                {/* Indicador de procesamiento */}
                {isProcessing && <p className="processing-indicator">⏳ Procesando archivo...</p>}
            </div>




            {/* SECCIÓN 2: Si hay datos cargados, mostrar controles y visualización */}
            {data.length > 0 && (
                <>
                    {/* SECCIÓN 2.1: Controles para configurar el gráfico */}
                    <div className="chart-config">
                        {/* Selector para columna del Eje X */}
                        <div className="config-group">
                            <label>Eje X (Categoría):</label>
                            <select
                                value={selectedColumns.x}
                                onChange={(e) => setSelectedColumns({ ...selectedColumns, x: e.target.value })}
                            >
                                {/* Mostrar todas las columnas disponibles como opciones */}
                                {columns.map(col => (
                                    <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>

                        {/* Selector para columna del Eje Y */}
                        <div className="config-group">
                            <label>Eje Y (Valor):</label>
                            <select
                                value={selectedColumns.y}
                                onChange={(e) => setSelectedColumns({ ...selectedColumns, y: e.target.value })}
                            >
                                {/* Mostrar todas las columnas disponibles como opciones */}
                                {columns.map(col => (
                                    <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>

                        {/* Selector para tipo de gráfico */}
                        <div className="config-group">
                            <label>Tipo de Gráfico:</label>
                            <select
                                value={chartType}
                                onChange={(e) => setChartType(e.target.value)}
                            >
                                <option value="bar">📊 Barras</option>
                                <option value="line">📈 Líneas</option>
                                <option value="pie">🥧 Pastel</option>
                            </select>
                        </div>

                        {/* Selector para orientación (solo para barras) */}
                        {chartType === 'bar' && (
                            <div className="config-group">
                                <label>Orientación:</label>
                                <select
                                    value={chartOrientation}
                                    onChange={(e) => setChartOrientation(e.target.value)}
                                >
                                    <option value="vertical">Vertical</option>
                                    <option value="horizontal">Horizontal</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN 2.2: Mostrar el gráfico */}
                    <div className="chart-section">
                        <h3>Gráfico por Referencia - {datosAgrupados.length} referencias filtradas</h3>
                        {selectedColumns.y === "CUMPLIMIENTO (%)" && (
                            <div className="cumplimiento-summary">
                                <div className="summary-item">
                                    <span className="summary-label">Promedio:</span>
                                    <span className="summary-value">
                                        {(datosAgrupados.reduce((sum, row) => sum + (row["CUMPLIMIENTO (%)"] || 0), 0) / datosAgrupados.length).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        )}
                        {selectedReferencia && (
                            <button type="button" style={{ marginBottom: '12px', padding: '8px 12px' }} onClick={() => setSelectedReferencia(null)}>
                                ← Volver al resumen
                            </button>
                        )}
                        <div id="main" style={{ width: '100%', height: datosAgrupados.length > 20 ? '800px' : '600px', cursor: 'pointer' }}></div>
                    </div>
                </>
            )}

            {/* SECCIÓN 2.3: Tabla con todos los datos del archivo */}
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '20px', alignItems: 'start' }}>
                    <div className="filter-card">
                        <h4>Años</h4>
                        <p className="hint">Selecciona uno o varios. Ctrl/Cmd + clic.</p>
                        <div className="checkbox-group">
                            {años.map(a => (
                                <label key={a} className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={anio.includes(a)}
                                        onChange={() => {
                                            const has = anio.includes(a)
                                            setAnio(has ? anio.filter(v => v !== a) : [...anio, a])
                                            if (!has && mes.length === 0) setMes([])
                                        }}
                                    />
                                    {a}
                                </label>
                            ))}
                        </div>
                        {anio.length > 0 && (
                            <div className="selected-chip-group">
                                {anio.map(a => <span key={a} className="selected-chip">{a}</span>)}
                            </div>
                        )}
                    </div>

                    <div className="filter-card">
                        <h4>Meses</h4>
                        <p className="hint">Selecciona uno o varios.</p>
                        <div className="checkbox-group">
                            {meses.map(m => (
                                <label key={m} className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={mes.includes(m)}
                                        onChange={() => {
                                            if (!anio.length) return
                                            const has = mes.includes(m)
                                            setMes(has ? mes.filter(v => v !== m) : [...mes, m])
                                        }}
                                        disabled={!anio.length}
                                    />
                                    {m}
                                </label>
                            ))}
                        </div>
                        {mes.length > 0 && (
                            <div className="selected-chip-group">
                                {mes.map(m => <span key={m} className="selected-chip">{m}</span>)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="table-wrapper">
                    <h3>
                        Datos Agrupados por Referencia ({datosAgrupados.length} referencias, {filtrados.length} registros totales)
                        {datosTabla.length > 50 && <span style={{ color: '#666', fontSize: '0.9em', fontWeight: 'normal' }}> - Mostrando primeras 50 referencias</span>}
                    </h3>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th></th>
                                {columns.map(k => <th key={k}>{k}</th>)}
                                <th>N° OPs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {datosTabla.map((row, i) => {
                                const refKey = row[colReferencia] || `ref-${i}`
                                const expanded = !!expandedRefs[refKey]
                                return (
                                    <React.Fragment key={refKey}>
                                        <tr className="reference-row">
                                            <td style={{ cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setExpandedRefs(prev => ({ ...prev, [refKey]: !prev[refKey] }))}>
                                                {expanded ? '▼' : '▶'}
                                            </td>
                                            {columns.map((key, j) => {
                                                const v = row[key]
                                                let displayValue = v

                                                if (key === 'CUMPLIMIENTO (%)' && displayValue !== undefined) {
                                                    displayValue = `${Number(displayValue).toFixed(2)}%`
                                                } else if (typeof v === 'number') {
                                                    displayValue = v.toFixed(2)
                                                }

                                                return (
                                                    <td key={j} className={key === "CUMPLIMIENTO (%)" ? `cumplimiento-${Number(displayValue) >= 80 ? 'alto' : Number(displayValue) >= 50 ? 'medio' : 'bajo'}` : ''}>
                                                        {displayValue}
                                                    </td>
                                                )
                                            })}
                                            <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{row._count || 1}</td>
                                        </tr>
                                        {expanded && row._ops && row._ops.map((opRow, opIndex) => (
                                            <tr key={`${refKey}-op-${opIndex}`} className="op-row">
                                                <td></td>
                                                {columns.map((col, colIndex) => (
                                                    <td key={`${opIndex}-${colIndex}`} className={col === "CUMPLIMIENTO (%)" ? `cumplimiento-${(opRow[col] || 0) >= 80 ? 'alto' : (opRow[col] || 0) >= 50 ? 'medio' : 'bajo'}` : ''}>
                                                        {col === "CUMPLIMIENTO (%)" ? `${(opRow[col] || 0).toFixed?.(2) || opRow[col] || 0}%` : opRow[col]}
                                                    </td>
                                                ))}
                                                <td style={{ fontStyle: 'italic', textAlign: 'center' }}>OP</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>





            {/* SECCIÓN 3: Mensaje si NO hay datos cargados */}
            {!data.length && (
                <div className="empty-state">
                    <p>👆 Sube un archivo Excel para comenzar</p>
                </div>
            )}
        </div>
    )
}


export default Read
