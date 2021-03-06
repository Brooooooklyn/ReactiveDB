import 'rxjs/observable/dom/ajax'
import { Observable } from 'rxjs'
import { database } from './database'
import factory from '../schemas'

factory(database)
database.connect()

Observable.ajax({
  url: `http://project.ci/api/v2/tasks/me/?count=100&isDone=false&page=1`,
  withCredentials: true,
  crossDomain: true
})
.map(r => {
  return r.response
})
.concatMap(r => {
  // return Observable.from(r).concatMap(r2 => {
  //   return database.upset3('Task', r2)
  // })
  return database.upsert('Task', r)
})
.do({
  error: () => {
    database.get('Task').values().subscribe(ret => console.warn(ret))
  }
})
.concatMap(() => {
  console.timeEnd('Task insert')
  return Observable.ajax({
    url: `http://project.ci/api/v2/tasks/me/subtasks?count=500&isDone=false&page=1`,
    withCredentials: true,
    crossDomain: true
  })
})
.map(r => r.response)
.concatMap(r => database.insert('Subtask', r))
.do(() => {
  database.insert('Subtask', {
    _id: 1,
    content: 'foo',
    _taskId: '56cfbabb981fbfc92eb8f517',
    isDone: true,
    created: new Date().toISOString()
  })
})
.concatMap(() => {
  return database.get('Task').values()
})
.subscribe((_) => {
  console.warn('effected records count:', _)
  database.get('Task').values().subscribe(r => console.warn(r))
}, err => {
  console.error(err)
})
