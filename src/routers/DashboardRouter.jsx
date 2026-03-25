import { Routes, Route } from 'react-router-dom'
import Navbar from '../components/ui/Navbar'
import RegisterScreen from '../components/login/RegisterScreen'
import Mapa from '../components/mapa/Mapa'


const DashboardRouter = () => {

    return (
        <div>
            <Navbar />
            <div className="mx-3 my-4">
                <Routes>
                    <Route path="/" element={<Mapa />} />
                    <Route path="/register" element={<RegisterScreen />} />
                    <Route path="/mapa" element={<Mapa />} />
                    {/* <Route path="/listmyrequest" element={<Listmyrequest />} /> */}
                </Routes>
            </div>
        </div>
    )
}

export default DashboardRouter
