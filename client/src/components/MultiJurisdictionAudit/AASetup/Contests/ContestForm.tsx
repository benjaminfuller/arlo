/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react'
import { useParams } from 'react-router-dom'
import equal from 'fast-deep-equal'
import styled from 'styled-components'
import { Formik, FormikProps, Field, FieldArray, ErrorMessage } from 'formik'
import { Spinner, HTMLSelect } from '@blueprintjs/core'
import FormWrapper from '../../../Atoms/Form/FormWrapper'
import FormSection, {
  FormSectionDescription,
} from '../../../Atoms/Form/FormSection'
import FormField from '../../../Atoms/Form/FormField'
import {
  TwoColumnSection,
  InputFieldRow,
  InputLabel,
  FlexField,
  Action,
} from '../../../Atoms/Form/styledBits'
import FormButtonBar from '../../../Atoms/Form/FormButtonBar'
import FormButton from '../../../Atoms/Form/FormButton'
import schema from './schema'
import { ISidebarMenuItem } from '../../../Atoms/Sidebar'
import useContests from '../../useContests'
import useJurisdictions from '../../useJurisdictions'
import { IContest, ICandidate } from '../../../../types'
import DropdownCheckboxList from './DropdownCheckboxList'
import Card from '../../../Atoms/SpacedCard'
import { testNumber } from '../../../utilities'
import { isObjectEmpty } from '../../../../utils/objects'
import { IAuditSettings } from '../../useAuditSettings'
import useStandardizedContests from '../../useStandardizedContests'
import { ErrorLabel } from '../../../Atoms/Form/_helpers'
import { partition } from '../../../../utils/array'

const Select = styled(HTMLSelect)`
  margin-top: 5px;
`

interface IProps {
  isTargeted: boolean
  nextStage: ISidebarMenuItem
  prevStage: ISidebarMenuItem
  locked: boolean
  auditType: IAuditSettings['auditType']
}

const ContestForm: React.FC<IProps> = ({
  isTargeted,
  nextStage,
  prevStage,
  locked,
  auditType,
}) => {
  const contestValues: IContest[] = [
    {
      id: '',
      name: '',
      isTargeted,
      totalBallotsCast: '',
      numWinners: '1',
      votesAllowed: '1',
      jurisdictionIds: [],
      choices: [
        {
          id: '',
          name: '',
          numVotes: '',
        },
        {
          id: '',
          name: '',
          numVotes: '',
        },
      ],
    },
  ]

  const isBatch = auditType === 'BATCH_COMPARISON'
  const isHybrid = auditType === 'HYBRID'
  const isBallotPolling = auditType === 'BALLOT_POLLING'

  const { electionId } = useParams<{ electionId: string }>()
  const [contests, updateContests] = useContests(electionId, auditType)
  const jurisdictions = useJurisdictions(electionId)
  const standardizedContests = useStandardizedContests(electionId)

  if ((isHybrid && !standardizedContests) || !jurisdictions || !contests)
    return null // Still loading
  const [formContests, restContests] = partition(
    contests,
    c => c.isTargeted === isTargeted
  )

  /* istanbul ignore next */
  if (isBatch && !isTargeted && nextStage.activate) nextStage.activate() // skip to next stage if on opportunistic contests screen and during a batch audit (until batch audits support multiple contests)

  const initialValues = {
    contests: formContests.length ? formContests : contestValues,
  }

  const isOpportunisticFormClean = (
    touched: {},
    values: { contests: IContest[] }
  ) => {
    return (
      !isTargeted && (isObjectEmpty(touched) || equal(initialValues, values))
    )
  }

  const goToNextStage = () => {
    if (nextStage.activate) nextStage.activate()
    else throw new Error('Wrong menuItems passed in: activate() is missing')
  }

  const submit = async (values: { contests: IContest[] }) => {
    const contestsToUpdate = isHybrid
      ? values.contests.map(contest => ({
          ...contest,
          jurisdictionIds: standardizedContests!.find(
            c => c.name === contest.name
          )!.jurisdictionIds,
        }))
      : values.contests
    const response = await updateContests(contestsToUpdate.concat(restContests))
    if (!response) return
    goToNextStage()
  }
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={schema(auditType)}
      enableReinitialize
      onSubmit={submit}
    >
      {({
        values,
        touched,
        handleSubmit,
        setFieldValue,
        isSubmitting,
      }: FormikProps<{ contests: IContest[] }>) => (
        <form data-testid="form-one">
          <FormWrapper
            title={isTargeted ? 'Target Contests' : 'Opportunistic Contests'}
          >
            <FieldArray
              name="contests"
              render={contestsArrayHelpers => (
                <>
                  {values.contests.map((contest: IContest, i: number) => {
                    const jurisdictionOptions = jurisdictions.map(j => ({
                      title: j.name,
                      value: j.id,
                      checked: contest.jurisdictionIds.indexOf(j.id) > -1,
                    }))
                    return (
                      /* eslint-disable react/no-array-index-key */
                      <Card key={i}>
                        <FormSection
                          label={`Contest ${
                            values.contests.length > 1 ? i + 1 : ''
                          } Info`}
                        >
                          <br />
                          {isHybrid && standardizedContests ? (
                            <div>
                              <FormSectionDescription>
                                Select the name of the contest that will drive
                                the audit.
                              </FormSectionDescription>
                              <label htmlFor={`contests[${i}].name`}>
                                Contest{' '}
                                {values.contests.length > 1 ? i + 1 : ''} Name
                                <br />
                                <Field
                                  component={Select}
                                  id={`contests[${i}].name`}
                                  name={`contests[${i}].name`}
                                  onChange={(
                                    e: React.FormEvent<HTMLSelectElement>
                                  ) =>
                                    setFieldValue(
                                      `contests[${i}].name`,
                                      e.currentTarget.value
                                    )
                                  }
                                  disabled={locked}
                                  value={values.contests[i].name}
                                  options={[
                                    { value: '' },
                                    ...standardizedContests.map(({ name }) => ({
                                      label: name,
                                      value: name,
                                    })),
                                  ]}
                                />
                                <ErrorMessage
                                  name={`contests[${i}].name`}
                                  component={ErrorLabel}
                                />
                              </label>
                            </div>
                          ) : (
                            <div>
                              <FormSectionDescription>
                                Enter the name of the contest that will drive
                                the audit.
                              </FormSectionDescription>
                              <label htmlFor={`contests[${i}].name`}>
                                Contest{' '}
                                {values.contests.length > 1 ? i + 1 : ''} Name
                                <Field
                                  id={`contests[${i}].name`}
                                  name={`contests[${i}].name`}
                                  disabled={locked}
                                  component={FormField}
                                />
                              </label>
                            </div>
                          )}
                          <FormSectionDescription>
                            Enter the number of winners for the contest.
                          </FormSectionDescription>
                          <label htmlFor={`contests[${i}].numWinners`}>
                            Winners
                            <Field
                              id={`contests[${i}].numWinners`}
                              name={`contests[${i}].numWinners`}
                              disabled={locked}
                              component={FormField}
                              validate={testNumber()}
                            />
                          </label>
                          <FormSectionDescription>
                            Number of selections the voter can make in the
                            contest.
                          </FormSectionDescription>
                          <label htmlFor={`contests[${i}].votesAllowed`}>
                            Votes Allowed
                            <Field
                              id={`contests[${i}].votesAllowed`}
                              name={`contests[${i}].votesAllowed`}
                              disabled={locked}
                              component={FormField}
                              validate={testNumber()}
                            />
                          </label>
                        </FormSection>
                        <FieldArray
                          name={`contests[${i}].choices`}
                          render={choicesArrayHelpers => (
                            <FormSection
                              label="Candidates/Choices & Vote Totals"
                              description="Enter the name of each candidate choice that appears on the ballot for this contest."
                            >
                              <TwoColumnSection>
                                {contest.choices.map(
                                  (choice: ICandidate, j: number) => (
                                    /* eslint-disable react/no-array-index-key */
                                    <React.Fragment key={j}>
                                      <InputFieldRow>
                                        <InputLabel>
                                          Name of Candidate/Choice {j + 1}
                                          <Field
                                            name={`contests[${i}].choices[${j}].name`}
                                            disabled={locked}
                                            component={FlexField}
                                          />
                                        </InputLabel>
                                        <InputLabel>
                                          Votes for Candidate/Choice {j + 1}
                                          <Field
                                            name={`contests[${i}].choices[${j}].numVotes`}
                                            disabled={locked}
                                            component={FlexField}
                                            validate={testNumber()}
                                          />
                                        </InputLabel>
                                        {contest.choices.length > 2 &&
                                          !locked && (
                                            <Action
                                              onClick={() =>
                                                choicesArrayHelpers.remove(j)
                                              }
                                            >
                                              Remove choice {j + 1}
                                            </Action>
                                          )}
                                      </InputFieldRow>
                                    </React.Fragment>
                                  )
                                )}
                                {!locked && (
                                  <Action
                                    onClick={() =>
                                      choicesArrayHelpers.push({
                                        name: '',
                                        numVotes: '',
                                      })
                                    }
                                  >
                                    Add a new candidate/choice
                                  </Action>
                                )}
                              </TwoColumnSection>
                            </FormSection>
                          )}
                        />
                        {isBallotPolling && (
                          <FormSection
                            label="Total Ballots Cast"
                            description="Enter the overall number of ballot cards cast in jurisdictions containing this contest."
                          >
                            <label htmlFor={`contests[${i}].totalBallotsCast`}>
                              Total Ballots for Contest{' '}
                              {/* istanbul ignore next */
                              values.contests.length > 1 ? i + 1 : ''}
                              <Field
                                id={`contests[${i}].totalBallotsCast`}
                                name={`contests[${i}].totalBallotsCast`}
                                validate={testNumber()}
                                disabled={locked}
                                component={FormField}
                              />
                            </label>
                          </FormSection>
                        )}
                        {!isHybrid && (
                          <FormSection
                            label="Contest Universe"
                            description="Select the jurisdictions where this contest appeared on the ballot."
                          >
                            <DropdownCheckboxList
                              text="Select Jurisdictions"
                              optionList={jurisdictionOptions}
                              formikBag={{ values, setFieldValue }}
                              contestIndex={i}
                            />
                            <ErrorMessage
                              name={`contests[${i}].jurisdictionIds`}
                              component={ErrorLabel}
                            />
                          </FormSection>
                        )}
                        {values.contests.length > 1 && (
                          <FormButtonBar right>
                            <FormButton
                              intent="danger"
                              onClick={() => contestsArrayHelpers.remove(i)}
                            >
                              Remove Contest {i + 1}
                            </FormButton>
                          </FormButtonBar>
                        )}
                      </Card>
                    )
                  })}
                  {!isBatch && ( // TODO support multiple contests in batch comparison audits
                    <FormButtonBar>
                      <FormButton
                        type="button"
                        onClick={() =>
                          contestsArrayHelpers.push({ ...contestValues[0] })
                        }
                      >
                        Add another {isTargeted ? 'targeted' : 'opportunistic'}{' '}
                        contest
                      </FormButton>
                    </FormButtonBar>
                  )}
                </>
              )}
            />
          </FormWrapper>
          {nextStage.state === 'processing' ? (
            <Spinner />
          ) : (
            <FormButtonBar>
              <FormButton onClick={prevStage.activate}>Back</FormButton>
              <FormButton
                type="submit"
                intent="primary"
                loading={isSubmitting}
                disabled={nextStage.state === 'locked'}
                onClick={e => {
                  e.preventDefault()
                  if (isOpportunisticFormClean(touched, values)) goToNextStage()
                  else handleSubmit()
                }}
              >
                Save &amp; Next
              </FormButton>
            </FormButtonBar>
          )}
        </form>
      )}
    </Formik>
  )
}

export default ContestForm
