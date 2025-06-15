//La idea de crea un contexto a un nivel "alto" al que se pueda acceder desde cualquier componente
//Se pueden contextos 
//Un contexto es un HOC 

import { useState } from "react";
import { createContext } from "react";

export const UserContext=createContext();

/* const usuario={
    id:111,
    name:'pepe',
    email:'pepe@pepe.es',
} */

//vamos a crear un provider
export const UserProvider1=({children})=>{
    //Aquí se implenta la lógica del provider

    return(
        <UserContext.Provider value={{hola:'Mundo',user: usuario }}>
            {children}
        </UserContext.Provider>
    )

}

export const UserProvider=({children})=>{
    //Aquí se implenta la lógica del provider
    const [user, setUser] = useState();

    return(
        <UserContext.Provider value={{user,setUser}}>
            {children}
        </UserContext.Provider>
    )

}