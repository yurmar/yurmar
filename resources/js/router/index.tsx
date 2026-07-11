import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/home'

const Login = lazy(() => import('@/pages/login'))
// const Portfolio = lazy(() => import('@/pages/portfolio'))
const About = lazy(() => import('@/pages/about'))
const Contacts = lazy(() => import('@/pages/contacts'))
const Notebook = lazy(() => import('@/pages/notebook'))
const Orders = lazy(() => import('@/pages/orders'))
const Examples = lazy(() => import('@/pages/examples'))
const PhoneBook = lazy(() => import('@/pages/examples/phoneBook'))
const DailyReportList = lazy(() => import('@/pages/examples/dailyReport'))
const DailyReportDetail = lazy(() => import('@/pages/examples/dailyReport/report'))
const DocumentArchive = lazy(() => import('@/pages/examples/documentArchive'))
const HallOfHonorRegistry = lazy(() => import('@/pages/examples/hallOfHonor'))
const HallOfHonorFilters = lazy(() => import('@/pages/examples/hallOfHonor/filters'))
const HallOfHonorReport = lazy(() => import('@/pages/examples/hallOfHonor/report'))
const BudgetOverview = lazy(() => import('@/pages/examples/budget'))
const BudgetRegions = lazy(() => import('@/pages/examples/budget/regions'))
const BudgetStructure = lazy(() => import('@/pages/examples/budget/structure'))
const StatisticsOverview = lazy(() => import('@/pages/examples/statistics'))
const StatisticsMonitoring = lazy(() => import('@/pages/examples/statistics/monitoring'))
const BranchRating = lazy(() => import('@/pages/examples/branchRating/rating'))
const BranchIndicators = lazy(() => import('@/pages/examples/branchRating/indicators'))
const BranchComparison = lazy(() => import('@/pages/examples/branchRating/comparison'))
const BranchesPage = lazy(() => import('@/pages/examples/branchRating/branches'))
const MeetingCalendar = lazy(() => import('@/pages/examples/meetingCalendar'))
const NotFound = lazy(() => import('@/pages/not-found'))

const fallback = <div className="min-h-screen" />

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        children: [
            { index: true, element: <Home /> },
            { path: 'login', element: <Suspense fallback={fallback}><Login /></Suspense> },
            // { path: 'portfolio', element: <Suspense fallback={fallback}><Portfolio /></Suspense> },
            { path: 'about', element: <Suspense fallback={fallback}><About /></Suspense> },
            { path: 'contacts', element: <Suspense fallback={fallback}><Contacts /></Suspense> },
            { path: 'notebook', element: <Suspense fallback={fallback}><Notebook /></Suspense> },
            { path: 'orders', element: <Suspense fallback={fallback}><Orders /></Suspense> },
            { path: 'examples/phone-book', element: <Suspense fallback={fallback}><PhoneBook /></Suspense> },
            { path: 'examples/daily-report', element: <Suspense fallback={fallback}><DailyReportList /></Suspense> },
            { path: 'examples/daily-report/:reportId', element: <Suspense fallback={fallback}><DailyReportDetail /></Suspense> },
            { path: 'examples/document-archive', element: <Suspense fallback={fallback}><DocumentArchive /></Suspense> },
            { path: 'examples/hall-of-honor', element: <Suspense fallback={fallback}><HallOfHonorRegistry /></Suspense> },
            { path: 'examples/hall-of-honor/filters', element: <Suspense fallback={fallback}><HallOfHonorFilters /></Suspense> },
            { path: 'examples/hall-of-honor/report', element: <Suspense fallback={fallback}><HallOfHonorReport /></Suspense> },
            { path: 'examples/budget', element: <Suspense fallback={fallback}><BudgetOverview /></Suspense> },
            { path: 'examples/budget/regions', element: <Suspense fallback={fallback}><BudgetRegions /></Suspense> },
            { path: 'examples/budget/structure', element: <Suspense fallback={fallback}><BudgetStructure /></Suspense> },
            { path: 'examples/statistics', element: <Suspense fallback={fallback}><StatisticsOverview /></Suspense> },
            { path: 'examples/statistics/monitoring', element: <Suspense fallback={fallback}><StatisticsMonitoring /></Suspense> },
            { path: 'examples/branch-rating', element: <Suspense fallback={fallback}><BranchRating /></Suspense> },
            { path: 'examples/branch-rating/indicators', element: <Suspense fallback={fallback}><BranchIndicators /></Suspense> },
            { path: 'examples/branch-rating/comparison', element: <Suspense fallback={fallback}><BranchComparison /></Suspense> },
            { path: 'examples/branch-rating/branches', element: <Suspense fallback={fallback}><BranchesPage /></Suspense> },
            { path: 'examples/meeting-calendar', element: <Suspense fallback={fallback}><MeetingCalendar /></Suspense> },
            { path: 'examples', element: <Suspense fallback={fallback}><Examples /></Suspense> },
            { path: 'examples/:folderId', element: <Suspense fallback={fallback}><Examples /></Suspense> },
            { path: '*', element: <Suspense fallback={fallback}><NotFound /></Suspense> },
        ],
    },
])
