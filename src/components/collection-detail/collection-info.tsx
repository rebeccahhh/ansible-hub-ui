import * as React from 'react';
import './collection-info.scss';

import * as moment from 'moment';
import { Link } from 'react-router-dom';

import {
  ClipboardCopy,
  Split,
  SplitItem,
  Grid,
  GridItem,
  FormSelect,
  FormSelectOption,
  Button,
} from '@patternfly/react-core';

import { DownloadIcon } from '@patternfly/react-icons';

import { CollectionDetailType, CollectionAPI } from '../../api';
import { Tag } from '../../components';
import { Paths, formatPath } from '../../paths';
import { ParamHelper } from '../../utilities/param-helper';

interface IProps extends CollectionDetailType {
  params: {
    version?: string;
  };
  updateParams: (params) => void;
}

export class CollectionInfo extends React.Component<IProps> {
  downloadLinkRef: any;

  constructor(props) {
    super(props);
    this.downloadLinkRef = React.createRef();
  }

  render() {
    const {
      name,
      latest_version,
      namespace,
      all_versions,
      params,
      updateParams,
    } = this.props;

    let installCommand = `ansible-galaxy collection install ${namespace.name}.${name}`;

    if (params.version) {
      installCommand += `:${params.version}`;
    }

    return (
      <div className='pf-c-content info-panel'>
        <h1>Info</h1>
        <Grid hasGutter={true}>
          <GridItem>{latest_version.metadata.description}</GridItem>
          <GridItem>
            {latest_version.metadata.tags.map((tag, i) => (
              <Tag key={i}>{tag}</Tag>
            ))}
          </GridItem>

          <GridItem>
            <Split hasGutter={true}>
              <SplitItem className='install-title'>License</SplitItem>
              <SplitItem isFilled>{latest_version.metadata.license}</SplitItem>
            </Split>
          </GridItem>
          <GridItem>
            <Split hasGutter={true}>
              <SplitItem className='install-title'>Installation</SplitItem>
              <SplitItem isFilled>
                <ClipboardCopy isReadOnly>{installCommand}</ClipboardCopy>
                <div>
                  <b>Note:</b> Installing collections with ansible-galaxy is
                  only supported in ansible 2.9+
                </div>
                <div>
                  <a ref={this.downloadLinkRef} style={{ display: 'none' }}></a>
                  <Button
                    className='download-button'
                    variant='link'
                    icon={<DownloadIcon />}
                    onClick={() =>
                      this.download(namespace, name, latest_version)
                    }
                  >
                    Download tarball
                  </Button>
                </div>
              </SplitItem>
            </Split>
          </GridItem>
          <GridItem>
            <Split hasGutter={true}>
              <SplitItem className='install-tile'>Install Version</SplitItem>
              <SplitItem isFilled>
                <FormSelect
                  onChange={val =>
                    updateParams(ParamHelper.setParam(params, 'version', val))
                  }
                  value={
                    params.version ? params.version : latest_version.version
                  }
                  aria-label='Select collection version'
                >
                  {all_versions.map(v => (
                    <FormSelectOption
                      key={v.version}
                      value={v.version}
                      label={`${v.version} released ${moment(
                        v.created,
                      ).fromNow()} ${
                        v.version === latest_version.version ? '(latest)' : ''
                      }`}
                    />
                  ))}
                </FormSelect>
              </SplitItem>
            </Split>
          </GridItem>

          {latest_version.docs_blob.collection_readme ? (
            <GridItem>
              <div className='readme-container'>
                <div
                  className='pf-c-content'
                  dangerouslySetInnerHTML={{
                    __html: latest_version.docs_blob.collection_readme.html,
                  }}
                />
                <div className='fade-out'></div>
              </div>
              <Link
                to={formatPath(
                  Paths.collectionDocsIndex,
                  {
                    collection: name,
                    namespace: namespace.name,
                  },
                  params,
                )}
              >
                Load full readme
              </Link>
            </GridItem>
          ) : null}
        </Grid>
      </div>
    );
  }

  private download(namespace, name, latest_version) {
    CollectionAPI.getDownloadURL(
      namespace.name,
      name,
      latest_version.version,
    ).then((downloadURL: string) => {
      // By getting a reference to a hidden <a> tag, setting the href and
      // programmatically clicking it, we can hold off on making the api
      // calls to get the download URL until it's actually needed. Clicking
      // the <a> tag also gets around all the problems using a popup with
      // window.open() causes.
      this.downloadLinkRef.current.href = downloadURL;
      this.downloadLinkRef.current.click();
    });
  }
}
