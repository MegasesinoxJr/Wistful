import { useState } from "react";


export const useForm = (initialForm={}) => {
    const [formState,setFormState]=useState(initialForm);
    
        
      const onInputChange=(e)=>{
          const {name,value}=e.target;
          //console.log(name)
          //console.log(value)
          setFormState({
            ...formState,
            [name]:value
          })
      }
      const onResetForm=()=>{
        setFormState(initialForm)
      }
  return {
    ...formState,
    formState,
    onInputChange,
    onResetForm,
  }
}
