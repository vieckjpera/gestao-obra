'use client'

import { useParams } from 'next/navigation'
import { EstimateForm } from '../../_EstimateForm'

export default function EditEstimatePage() {
  const params = useParams()
  const id = params.id as string
  return <EstimateForm estimateId={id} />
}
