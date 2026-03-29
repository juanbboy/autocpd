import './navbar.css';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { useDispatch, useSelector } from 'react-redux';
import { startLogout } from '../../actions/auth';

const Navbarr = () => {
    const dispatch = useDispatch();
    const name = useSelector(state => state.auth.displayName);


    const handleLogout = () => {
        dispatch(startLogout());
    }

    console.log(name)

    return (
        <Navbar bg="dark" variant="dark" expand="lg" className='justify-content-center'>
            {/* <Navbar.Toggle aria-controls="basic-navbar-nav" className='justify-content-center'>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="d-block mx-auto" role="img" viewBox="0 0 24 24"><title>Product</title><circle cx="12" cy="12" r="10" /><path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83m13.79-4l-5.74 9.94" /></svg> */}

            {/* <Navbar.Collapse id="basic-navbar-nav" className='text-center' > */}
            <Navbar.Brand className="mx-2 px-2 " href="/">
            </Navbar.Brand>
            <Nav className="mx-auto justify-content-center">
                <Nav.Link href="read">lector</Nav.Link>
                <Navbar.Brand><h3>{name}</h3></Navbar.Brand>
            </Nav>
            <Navbar.Brand className="mx-2 px-2 btn" onClick={handleLogout}>Salir</Navbar.Brand>

        </Navbar>
    )
}

export default Navbarr
