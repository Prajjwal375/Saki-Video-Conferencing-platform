import { Link } from "react-router-dom";

import React from 'react'
import "../App.css"
import { useNavigate } from "react-router-dom";
export default function LandingPage() {


    const router  = useNavigate();
    return (
        <div className='landingPageContainer'>
            <nav>
                <div className='navHeader'>
                    <h2> Saki Video Call</h2>
                </div>
                    
                <div className='navlist'>
                    
                    <p onClick={() => {
                        router("/auth")
                    }}>Join as Guest </p>
                    <p onClick={() => {
                        router("/auth")
                    }}>Register</p>
                    <div role='button'>
                        <p onClick={() => {
                        router("/auth")
                    }}>Login</p>
                    </div>
                </div>
                
            </nav>
            
            <div className="landingMainContainer">
                <div>
                    <h1><span style={{color: "#FF9839"}}>Connect</span> with your loved one</h1>
                    <p>Cover a distance by Saki Call</p>
                    <div role='button'>
                        <Link to="/auth">Get Started</Link>
                    </div>
                </div>
                <div>
                    <img src="/mobile.png" alt="" />
                </div>
            </div>
        </div>
    )
}