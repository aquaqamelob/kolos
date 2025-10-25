import { Avatar } from '~/components/ui/avatar'
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from '~/components/ui/dropdown'
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '~/components/ui/navbar'
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from '~/components/ui/sidebar'
import { SidebarLayout } from '~/components/ui/sidebar-layout'
import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  
} from '@heroicons/react/16/solid'
import Link from "next/link";
import {

  DocumentTextIcon

} from '@heroicons/react/20/solid'
import { getSession, signOut, signIn } from '~/server/auth';
import { redirect } from 'next/navigation';
import { api } from '~/trpc/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {

  const session = await getSession();

  if (!session) {
    await signIn();
  }

  const quiz = await api.quiz.getAll();

  return (
    <SidebarLayout
      navbar={
        <Navbar>
          <NavbarSpacer />
          <NavbarSection>
            
            <Dropdown>
              <DropdownButton as={NavbarItem}>
                <Avatar src={session?.user?.image} square />
              </DropdownButton>
              
            </Dropdown>
          </NavbarSection>
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <Dropdown>
              <form className="contents" action={async () => {
                "use server"
                
                redirect('/');
              }}>
                <DropdownButton as={SidebarItem} className="lg:mb-2.5" type='submit'>

                  <SidebarLabel className='text-3xl'>Kol<span className='text-red-500'>OS</span></SidebarLabel>
                  <ChevronDownIcon />
                </DropdownButton>
              </form>


            </Dropdown>
            <SidebarSection className="max-lg:hidden">
              

            </SidebarSection>
          </SidebarHeader>
          <SidebarBody>
            <SidebarSection className="max-lg:hidden">
              <SidebarHeading>Quizy</SidebarHeading>
              {quiz.map((quiz) => (
                
                  <Link href={`/quiz?id=${quiz.id}`} key={quiz.id} className="no-underline">
                    <SidebarItem key={quiz.id} >
                      <DocumentTextIcon />
                      <SidebarLabel>{quiz.title}</SidebarLabel>
                    </SidebarItem>
                  </Link>
              
              ))}

            </SidebarSection>
           
          </SidebarBody>
          <SidebarFooter className="max-lg:hidden">
            <Dropdown>
              <DropdownButton as={SidebarItem}>
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar src={session?.user?.image} className="size-10" square alt="" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">{session?.user?.name}</span>
                    <span className="block truncate text-xs/5 font-normal text-zinc-500 dark:text-zinc-400">
                      {session?.user?.email}
                    </span>
                  </span>
                </span>
                <ChevronUpIcon />
              </DropdownButton>
              <DropdownMenu className="min-w-64" anchor="top start">
               
                <DropdownDivider />
                <form className="contents" action={async () => {
                  "use server"
                  await signOut();
                  redirect('/');
                }}>
                  <DropdownItem type="submit" >
                    <ArrowRightStartOnRectangleIcon />
                    <DropdownLabel>Wyloguj sie</DropdownLabel>
                  </DropdownItem>
                </form>

              </DropdownMenu>
            </Dropdown>
          </SidebarFooter>
        </Sidebar>
      }
    >
      {children}
    </SidebarLayout>
  )
} 