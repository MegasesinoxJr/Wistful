import { useParams } from "react-router-dom"


export const Find = () => {
    const {coches, color}=useParams();
  return (
    <div>Busco coches: {coches} de color {color}</div>

  )
}
