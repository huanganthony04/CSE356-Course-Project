import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Login.css'

const Login = () => {

    const [ email, setEmail ] = useState('');
    const [ password, setPassword ] = useState('');
    //0 for none, 1 for fail, 2 for success
    const [ loginStatus, setLoginStatus ] = useState(0);

    const navigate = useNavigate();

    const handleSubmit = (event) => {
        event.preventDefault();
        
        //Use the login API route to try to log in.
        axios.post(
            'http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/login', 
            { username: email, password: password },
            { withCredentials: true }
        )
        .then((response) => {
            if(response.data.error) {
                setLoginStatus(1);
            }
            else {
                setLoginStatus(2);
                navigate('/')
            }
        })
        .catch((error) => {
            console.log(error);
        })
    }

    const statusText = () => {
        if (loginStatus === 0) {
            return;
        }
        if (loginStatus === 1) {
            return (<h4 className="failText">Invalid Credentials</h4>);
        }
        if (loginStatus === 2) {
            return (<h4 className="successText">Success! Logging in...</h4>);
        }
    }


    return (
        <>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email</label>
                    <input type="text" name="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}/>
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input type="password" name="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}/>
                </div>
                <button type="submit">Submit</button>
                {statusText()}
            </form>
        </>
    )
}

export default Login