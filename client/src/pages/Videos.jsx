import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Videos = () => {

    const navigate = useNavigate();

    const checkAuth = async () => {
        try {
            const response = await axios.get('http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/isloggedin', { withCredentials: true });
            if (response.data.error) {
                return false;
            }
            else {
                return true;
            }
        }
        catch(error) {
            console.log('Could not get auth. ', error.message);
            return false;
        }
    }

    useEffect(() => {

        //Get authorization. If the user is not logged in, redirect to login page.
        axios.get('http://anthonysgroup.cse356.compas.cs.stonybrook.edu/api/isloggedin', { withCredentials: true })
            .then((response) => {
                if (response.data.error) {
                    navigate('/login');
                }
            })

    }, []);

    return (
        <div>Videos</div>
    )
}

export default Videos