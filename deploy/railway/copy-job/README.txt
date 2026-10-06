Tiger private database initialization copy job — candidate only
PreparedOctober6,2026. No providerdeployment/sourcepassword/customerdata used.

What is tested
18 synthetic integration/guard tests PASS on a temporary loopback-only PG16.14
server/client, stopped and removed afterward. Python compilation and Bash syntax
PASS. ActualPG17.11 DockerHub image digest is pinned. Dockerfile includes the SAME
18tests in a mandatory PG17 synthetic buildstage; finalruntime COPYdepends on that
stage's proof so a failing suite prevents image creation. PG17container/build stage
has NOT run: no workingDocker/PG17 installation onMacBook or authorizediMac. No
install/imagepull/cloudbuild performed. Do not mistake localPG16 proof for PG17.

Tested behavior
- Exported read-only snapshot remains consistent when a new synthetic order is
  inserted from a separateconnection beforedump. Target retains snapshot1order,
  source retains2, then testfixture cleanup. No sourcewrite in jobitself.
- Columns/defaults, indexes, constraints/FKs, enums, RLS and logicaltablecounts/hashes
  match. Canonicalsearch_path prevents falseFK/default expression differences.
- CorruptSQL/partialrestore/manifestmismatch roll back targetapplicationobjects.
- Any pg_dumpfailure prevents restore, including validstdout followed by exit1.
- Dump is capped32MiBRAM, no dump/archivefile. Initialsource14MBfits expectedscope;
  futureoversize stops, not unlimitedresource use.
- Existingtarget tables are rejected, never overwritten. Both database/client major
  versions arechecked; runtime fixed17 (testharness canuse installedsyntheticmajor).
- Success writes fsyncedatomic completionmarker onlyafter verifiedCOMMIT. Retry
  withmarker refuses beforeexport; markerabsence on initializedvolume blocksstartup.
- Markerwritefailure preserves fullycommitted but unavailable isolateddata, no
  successclaim/re-export; manualretry rejectsnonemptytarget. Noautomaticcleanup.
- Child/client erroroutput is discarded; privateSQLserver errorlogging is limited
  for restoreconnection. Tests inject dummysecret/row intoerrors; neither appears
  in clientlogs orserverlog. MainCLI printsallowlisted stopcodes, nottracebacks.
- Missingownerhandoff/wrongproject/wrongservice/publicdomain/TCPproxy blocksCLI
  beforecopy. Newsequences/functions/views/triggers/policies require review; current
  source haszero ofthese, so no silentlyskipped unsupportedobjects. Noauth/storage.
- Sourcehook is deliberatelyNONEXECUTABLE so officialentrypoint SOURCES it into
  its parent shell. Afterjob returns, unset SOURCE_DB_PASSWORD/PGPASSWORD before
  finalexecpostgres. Parentunset behavior tested withdummysecret. Restartmarkercheck
  does not needsourcepassword and cannotrun initialization again.

Files
Dockerfile: immutableofficialPG17.11-bookworm base, requiredsyntheticteststage,
Pythonstdlib runtime, publicSupabaseCA, sourcehook + guardedstartup.
copy_job.py: fixedapprovedproject/service/ref/host; snapshots + RAMdump + atomic
restore/manifest/commit + marker. No secretARG/URLinargv, no datasourcefile.
init-copy.sh:300secondGNUtimeout; failures abortentrypoint, no longrunningDBexec.
start.sh/check_marker.py: incompleteinitializeddata failsclosed; completevolume
restartsafter clearing sourceenv. Never deletes/resetPGDATA or sourceobjects.
source-root-ca.crt: PUBLIC CAfromauthenticatedSupabaseprojectDownloadcertificate.
No sourcepassword included in files/DockerARG/image/Git. No sourcecredentialsviewed
or transferred byassistant. Testdummysecret is synthetic, not a providercredential.
.dockerignore excludes dotenv/log/dump/SQL/pycache artifacts; finalimagecopiesonly
productionjobfiles/publicCA/proofmarker, not testfixturedata or testscript.

Required cloud/synthetic preflight BEFORE realsecret handoff
1. Rechecktrialbalance and <=US$0.50 remainingapprovedaddedusagebudget; no paidplan.
   Latestread-onlybilling header$4.98left, LimitedTrial, no card/billinghistory.
   Headerrounding isnot precisebalance; existingpreviewusage isseparate. Checkagain
   immediatelybeforeprovision and monitorruntime after. Meterlag notinstantcap.
2. Build thisreviewedcandidate withoutanyrealSOURCE_DB_PASSWORD. RequiredPG17
   syntheticstage mustpass18/18. VerifyactualLinuxPG17client/server/tempUnixsocket
   contract; inspect buildlogs toconfirmonlysyntheticdata. No packageinstall onhost.
   KeepnoGitautodeploy/sourcepassword duringbuild; no secret buildARGinDockerfile.
   Newprivate service/volume remainsnewisolatedrehearsaltarget, never previewDB.
3. Confirm target service name tiger-rehearsal-pg17 inapprovedproject/environment,
   one replica, <=500MBnewvolume atPGDATA, No publicdomain/TCPproxy, no app/worker
   linkage. Set restartpolicyNEVERduringcopy; no automaticre-export afterfailure.
   Generate independenttargetDBauth throughordinaryprivateproviderconfiguration,
   not sourceapp/Stripe/Resendcredentials. SetDockerfilepath toreviewedjobcandidate.
4. Confirm authenticatedTLS sourceCA+hostname fromwithinsamejobnetwork beforedata,
   sslmodeverify-full. Sourceproofalreadypassed preauthentication fromMac withthe
   providerlinkedCA. TargetrestoreuseslocalUnixsocket, not public/networkTLS.
   DBprivateTCP review is confined toRailwayprojectWireguardnetwork; stockofficial
   runtimeimage doesnotenablePostgresTLS. Do not claim privateDBserverTLS enabled
   or use thiscandidateasproductionimage withoutseparateTLS/configreview.
5. Reviewprojectmembers and source-secret exposure. Sourcepassword becomes a
   SEALEDPROVIDERSTOREDvariable, available to builds/deployments—not memory-only.
   Sourcepasswordremoval/currentdeploymentcleanup cannot guaranteeerasure ofold
   providerconfigurationhistory/backups. Owner mustapprove thatnewsecret scope.

ONE owner handoff instruction, only AFTER preflight passes
“Approve temporary SOURCE_DB_PASSWORD as a sealed variable on the NEW private
`tiger-rehearsal-pg17` service, and its removal/redeploy after validation? Enter
that existingSupabaseDBpassword privately in Railway’s authenticatedVariablesUI,
seal it before deployment, and tell me only ‘sealed handoff complete’—never paste
it in chat. I will then run the already-approvedcopy within the$0.50trialbudget.
Removing thisvariable and redeploying preserves the samePGDATAvolume and does
NOT reset/reimport theDB; the initializationjob cannotrerun on thatcompletedvolume.
No SSH/publicport/production/email/payment/DNS change, and no data deletion.”

Do NOT issue this permission question beforePG17build/security/budgetpreflight.
Wait duringownerentry; no screenshot/DOMvalue/copy/export ofsecret. Owner usesown
privatepasswordmanager/sourceview, no assistantpasswordexport/reset/newaccess.
Afterhandoff confirmNAME/sealed state only. Addingupdatingvars triggers stageddeploy;
ownerandoperatorreview exactnewservice changes, noexistingproductionservice edit.
Remove sourcevariable aftervalidatedcopy only underapprovedremovalscope and redeploy
SAMEvolume. Never chooseReset/DeleteVolume. Refreshbudget; stoprehearsalcompute at
sixhours/creditlimitswhile retainingcopy forreview. Recordcreation/checkpoint and
askfresh action-timeapproval beforeanypermanentdeletion; no72hautomaticpurge.
If jobfails, keepblockedpartialvolume/private logs; do notrecopy/drop/delete without
newaction-specificapproval. Liveapp remainsSupabase throughout.

Limitations
PG17image build/copy/lifecycle underRailway areunrun; no productionparity/restore
or post-write rollback proof. SourceFreeplan no includedscheduledbackups. Candidate
jobcopiespublicschema only and intentionally excludesproviderroles/ACLs; target
ownedby privatepostgresrole, no broadpublic/anon/authenticated grants. Full effective
role/privilege mapping isseparate beforeanyappconnection. DumpconvertsSQLwithinRAM
and confirms sourceexit beforetargettransaction, so this isdirectno-archive transfer
with bounded memory buffering, not an unbuffered pipeline. No durablebackupcreated.
