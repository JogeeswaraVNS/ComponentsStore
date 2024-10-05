import React from 'react'
import {Outlet} from 'react-router-dom'
import ProjectNavbar from '../projectnavbar/ProjectNavbar'

function HomeLayout() {
  return (
    <div>
      <div>
        <ProjectNavbar/>
      </div>
      <div >
        <Outlet/>
      </div>
    </div>
  )
}

export default HomeLayout