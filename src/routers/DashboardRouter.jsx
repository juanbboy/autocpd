import { Routes, Route } from 'react-router-dom'
import Navbar from '../components/ui/Navbar'
import RegisterScreen from '../components/login/RegisterScreen'
import Mapa from '../components/mapa/Mapa'
import Read from '../components/read/Read'
import Pruebas1 from '../components/pruebas/Pruebas1'

const DashboardRouter = () => {

    return (
        <div>
            <Navbar />
            <div className="mx-3 my-4">
                <Routes>
                    <Route path="/" element={<Mapa />} />
                    <Route path="/register" element={<RegisterScreen />} />
                    <Route path="/pruebas" element={<Pruebas1 />} />
                    <Route path="/read" element={<Read />} />
                    {/* <Route path="/listmyrequest" element={<Listmyrequest />} /> */}
                </Routes>
            </div>
        </div>
    )
}

export default DashboardRouter
