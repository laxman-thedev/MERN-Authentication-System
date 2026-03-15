import React from 'react'
import NavBar from '../components/NavBar'
import Header from '../components/Header'

const Home = () => {
    return (
        <div className='flex flex-col items-center justify-center min-h-screen bg-[url("/bg_img.png")] bg-center  bg-cover'>
            {/* Navigation bar */}
            <NavBar />
            {/* Hero section */}
            <Header />
        </div>
    )
}

export default Home
