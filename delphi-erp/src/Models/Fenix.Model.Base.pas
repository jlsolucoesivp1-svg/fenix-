unit Fenix.Model.Base;

interface

type
  TEntityBase = class
  private
    FId: string;
  public
    property Id: string read FId write FId;
  end;

implementation

end.
