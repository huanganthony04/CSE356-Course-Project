import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Login.css'

const Login = () => {

    const [ username, setUsername ] = useState('');
    const [ password, setPassword ] = useState('');

    const navigate = useNavigate();

    useEffect(() => {

        //Get authorization. If the user is already logged in, redirect to main page.
        axios.get('http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/isloggedin', { withCredentials: true })
            .then((response) => {
                if (!response.data.error) {
                    navigate('/');
                }
            })
    }, []);

    const handleSubmit = (event) => {
        event.preventDefault();
        
        //Use the login API route to try to log in.
        axios.post(
            'http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/login', 
            { username: username, password: password },
            { withCredentials: true }
        )
        .then((response) => {
            if(response.data.error) {
                console.log(response.data.error);
            }
            else {
                navigate('/');
            }
        })
        .catch((error) => {
            console.log(error);
        })
    }

    return (
        //For the login form to work, add "onSubmit={handleSubmit}" to the form tag.
        //Adding this may fail the test however (But Milestone 2 may succeed, frontend script changed from Milestone 1)
        <>
            <form action="/api/login" method="post" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="username">Username</label>
                    <input type="text" name="username" id="username" value={username} onChange={(e) => setUsername(e.target.value)}/>
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input type="password" name="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}/>
                </div>
                <button type="submit">Login</button>
            </form>
        </>
    )
}

export default Login